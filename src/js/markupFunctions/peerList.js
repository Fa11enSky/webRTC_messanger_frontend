/**
 * Створює розмітку з списку ідентифікаторів, власному ідентифікатору
 * додається клас owner-id
 * @param {[string]} ids 
 * @param {string} selfId 
 * @returns {string}  Строка для innerHTML
 */
export function createPeerListMarkup(ids, selfId) {
  const markup = ids
    .map((peer) => {
      if (selfId && selfId === peer)
        return `<li class=\"owner-id\">${selfId}</li>`;
      return `<li>${peer}</li>`;
    })
    .join(" ");
  return markup;
}

/**
 * Створює окремий елементи списку з ідентифікатора
 * @param {string} id 
 * @returns {string} Строка для innerHTML
 */

export function createAppendPeerMarkup(id) {
  return `<li>${id}</li>`;
}