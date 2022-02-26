export const getTagsQuery = searchString => [
  { $unwind: '$tags' },
  {
    $match:
    {
      $and: [
        { tags: { $regex: `.*${searchString}.*`, $options: 'i' } },
        { slug: { $ne: null } }
      ]
    }
  },
  { $group: { _id: null, uniqueTags: { $push: '$tags' } } },
  {
    $project: {
      _id: 0,
      uniqueTags: {
        $reduce: {
          input: '$uniqueTags',
          initialValue: [],
          in: {
            $let: {
              vars: { elem: { $concatArrays: [['$$this'], '$$value'] } },
              in: { $setUnion: '$$elem' }
            }
          }
        }
      }
    }
  }
];
