import by from 'thenby';

export function groupCommentsByTopic(comments) {
  const commentsSortedAsc = comments.sort(by(comment => comment.createdOn, 'asc'));
  const topicsSortedDesc = [...new Set(commentsSortedAsc.map(comment => comment.topic))].reverse();

  const commentGroups = topicsSortedDesc.reduce((accu, topic) => {
    accu[topic] = commentsSortedAsc.filter(comment => comment.topic === topic);
    return accu;
  }, {});

  return commentGroups;
}
