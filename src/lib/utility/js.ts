export const asyncForEach = async (array: any[], callback: (...args: any[]) => void) => {
  for (let index = 0, len = array.length; index < len; index += 1) {
    await callback(array[index], index, array);
  }
};
