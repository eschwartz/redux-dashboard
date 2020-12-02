import App from './components/App/App';
import Dashboard from './components/Dashboard/Dashboard';
import Passengers from './components/Passengers/Passengers';
import SpeedControl from './components/SpeedControl/SpeedControl';
import React from 'react';
import { shallow, mount } from 'enzyme';
import {default as waitFor} from 'wait-for-expect';
import {storeInstance as store} from './index'
import { Provider } from 'react-redux';

// Mock react-dom, so we can import `index.js`
// without actually rendering the app to the DOM.
// See __mocks__/react-dom.js
// https://jestjs.io/docs/en/manual-mocks#mocking-node-modules
jest.mock('react-dom');

it('Components use `connect()` to allow dispatch', async() => {
  expect(
    mountWithStore(Dashboard).prop('dispatch'), 
    'The `Dashboard` component needs to be `connect()`\'d'
  ).toBeDefined();

  expect(
    mountWithStore(Passengers).prop('dispatch'), 
    'The `Passengers` component needs to be `connect()`\'d'
  ).toBeDefined();

  expect(
    mountWithStore(SpeedControl).prop('dispatch'), 
    'The `SpeedControl` component needs to be `connect()`\'d'
  ).toBeDefined();
});

it('Components map Redux State to props to allow props to render ', async() => {
});

it('Speed: Reducer Increases and Decreases by 1', async() => {
});

it('Speed: Buttons click dispatches actions to increase and decrease speed reducer value', async() => {
});

it('Speed: Reducer does all the math', async() => {
});

it('Speed: Component renders from Redux', async() => {
});

it('Passenger: View displays list of passenger names', async() => {
});

it('Passenger: Button click dispatches action with payload of text input field as new string to passenger reducer', async() => {
});

it('Passenger: Reducer properly uses spread operator', async() => {
});

it('Dashboard: Displays current speed reducer speed number', async() => {
});

it('Dashboard: Displays current passenger count', async() => {
});


function mountWithStore(Component) {
  let provider = mount(
    <Provider store={store}>
      {React.createElement(Component)}
    </Provider>
  );

  // If the component is wrapped in a Redux <Connect />,
  // we want to dive deeper into the actual component.
  let componentName = Component.WrappedComponent ?
    Component.WrappedComponent.name :
    Component.name;

  // Find the actual component
  return provider.find(componentName);
}