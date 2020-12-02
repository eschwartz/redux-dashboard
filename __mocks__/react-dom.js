// Mock react-dom, so we can import `index.js`
// without actually rendering the app to the DOM.
// https://jestjs.io/docs/en/manual-mocks#mocking-node-modules
export default {
  render: (component, rootElement) => {}
};