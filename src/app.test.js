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

/**
Tests:

 Functional requirements
- Speed: should start at 0
- Speed: Increase / Decrease buttons update speed on DOM
- Speed: Value is held in Redux state
- Passenger: Default entry with your name
- Passenger: Adding a passenger shows them in the DOM
- Passenger: Add a passenger
- Dashboard: Show current speed
- Dashboard: Show passenger count

Technical requirements
- Components use `connect()` to talk to redux
- Speed and Passengers are held in redux state
- Speed and Passengers have default values
- Passenger count is _not_ held in redux state (should do "math" in component)
- Reducers do not mutate state (ie. use spread operator)
 */


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