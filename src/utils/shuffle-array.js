export default function shuffleArray(array) {
  const result = array.slice();

  for (let index = result.length - 1; index > 0; index -= 1) {
    const newIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[newIndex]] = [result[newIndex], result[index]];
  }

  return result;
}
