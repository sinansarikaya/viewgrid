globalThis.document.querySelector('#apply').addEventListener('click', () => {
  globalThis.document.querySelector('#result').textContent = `Applied: ${globalThis.document.querySelector('#name').value}`;
});
