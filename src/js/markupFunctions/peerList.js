/**
 * Створює розмітку з списку ідентифікаторів, власному ідентифікатору
 * додається клас owner-id
 * @param {[Crypto.UUID]} ids 
 * @param {Crypto.UUID} selfId 
 * @returns 
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
 * @param {Crypto.UUID} id 
 * @returns 
 */

export function createAppendPeerMarkup(id) {
  return `<li>${id}</li>`;
}