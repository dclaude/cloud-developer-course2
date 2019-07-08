import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';
import { config } from '../../../../config/config';
import https from 'https';
import fs from 'fs';

const router: Router = Router();

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
  const items = await FeedItem.findAndCountAll({ order: [['id', 'DESC']] });
  items.rows.map(item => {
    if (item.url) {
      item.url = AWS.getGetSignedUrl(item.url);
    }
  });
  res.send(items);
});

// GET by id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const {
    params: { id }
  } = req;
  if (!id) {
    return res.status(400).send('Invalid id');
  }
  const item = await FeedItem.findByPk(id);
  if (!item) {
    return res.status(404).send(`id[${id}] not found`);
  }
  if (item.url) {
    item.url = AWS.getGetSignedUrl(item.url);
  }
  res.status(200).send(item);
});

// PATCH
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { body } = req;
  const {
    params: { id }
  } = req;
  if (!id) {
    return res.status(400).send('Invalid id');
  }
  const item = await FeedItem.findByPk(id);
  if (!item) {
    return res.status(404).send(`id[${id}] not found`);
  }
  const savedItem = await item.update(body);
  if (savedItem.url) {
    savedItem.url = AWS.getGetSignedUrl(savedItem.url);
  }
  res.status(200).send(savedItem);
});

// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', requireAuth, async (req: Request, res: Response) => {
  let { fileName } = req.params;
  const url = AWS.getPutSignedUrl(fileName);
  res.status(201).send({ url: url });
});

function createFilteredImage(id: number, fileName: string, authorization: string): Promise<string> {
  const getSignedUrl = AWS.getGetSignedUrl(fileName);
  const { imageFilterApi } = config;
  const tmpDir = './tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }
  const filteredImageFile = `${tmpDir}/filtered.${Math.floor(Math.random() * 2000)}.${fileName}`;
  const filteredImageStream = fs.createWriteStream(filteredImageFile);
  return new Promise<string>((resolve, reject) => {
    const encodedUrl = encodeURIComponent(getSignedUrl);
    const url = `${imageFilterApi}/filteredimage?image_url=${encodedUrl}`;
    console.log(`createFilteredImage() id[${id}] start getSignedUrl[${getSignedUrl}] url[${url}]`);
    https
      .get(url, { headers: { authorization } }, res => {
        if (res.statusCode !== 200) {
          reject(res.statusMessage);
        }
        res.on('data', chunk => filteredImageStream.write(chunk));
        res.on('end', () => {
          console.log(`createFilteredImage() id[${id}] stop file[${filteredImageFile}]`);
          filteredImageStream.end();
          resolve(filteredImageFile);
        });
      })
      .on('error', error => {
        console.log(`createFilteredImage() id[${id}] error[${error}]`);
        reject(error);
      });
  });
}

let postRequestId = 0;

// Post meta data and the filename after a file is uploaded
// NOTE the file name is the key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const caption = req.body.caption;
  const fileName: string = req.body.url;

  // check Caption is valid
  if (!caption) {
    return res.status(400).send({ message: 'Caption is required or malformed' });
  }

  // check Filename is valid
  if (!fileName) {
    return res.status(400).send({ message: 'File url is required' });
  }

  // the code below works because the frontend first upload the picture to S3 before calling this end-point
  const id = ++postRequestId;
  console.log(`POST /feed id[${id}] fileName[${fileName}]`);
  const {
    headers: { authorization }
  } = req;
  try {
    const filteredImageFile = await createFilteredImage(id, fileName, authorization);
    await AWS.upload(fileName, fs.createReadStream(filteredImageFile));
    fs.unlinkSync(filteredImageFile);
  } catch (error) {
    console.log(`POST /feed id[${id}] error[${error}]`);
    return res.status(500).send(`${error}`);
  }

  const item = await new FeedItem({
    caption: caption,
    url: fileName
  });

  const savedItem = await item.save();

  savedItem.url = AWS.getGetSignedUrl(savedItem.url);
  res.status(201).send(savedItem);
});

export const FeedRouter: Router = router;
