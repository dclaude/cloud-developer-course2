import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

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

// Post meta data and the filename after a file is uploaded
// NOTE the file name is the key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const caption = req.body.caption;
  const fileName = req.body.url;

  // check Caption is valid
  if (!caption) {
    return res.status(400).send({ message: 'Caption is required or malformed' });
  }

  // check Filename is valid
  if (!fileName) {
    return res.status(400).send({ message: 'File url is required' });
  }

  const item = await new FeedItem({
    caption: caption,
    url: fileName
  });

  const saved_item = await item.save();

  saved_item.url = AWS.getGetSignedUrl(saved_item.url);
  res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;
