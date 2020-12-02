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

it('Speed: Initial speed shows as `0`', async() => {
  let speedControl = mountWithStore(SpeedControl);

  expect(
    speedControl.text(),
    'Speed Control component should render "SPEED: 0" on initial load',
  ).toMatch(/SPEED:\s*0/i)
});

it('Speed: Increase/Decrease buttons should update the speed on the DOM', async() => {
  let speedControl = mountWithStore(SpeedControl);

  // Find the "Increase Speed Button"
  let increaseButton = findByText(speedControl, 'Increase Speed');
  expect(
    increaseButton.length,
    'Make sure you have a single button that says "Increase Speed"'
  ).toBe(1);

  // Find the "Decrease Speed Button"
  let decreaseButton = findByText(speedControl, 'Decrease Speed');
  expect(
    decreaseButton.length,
    'Make sure you have a single button that says "Decrease Speed"'
  ).toBe(1);

  // Click the "Increase Speed" button 4x times
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');

  // Should render "SPEED: 4"
  expect(
    speedControl.text(),
    'Should render "SPEED: 4" after clicking "Increase Speed" 4x times',
  ).toMatch(/SPEED:\s*4/i)

  // Click the "Decrease Speed" button 4x times
  decreaseButton.last().simulate('click');
  decreaseButton.last().simulate('click');

  // Should render "SPEED: 2"
  expect(
    speedControl.text(),
    'Should render correct speed after clicking the "Decrease Speed" button',
  ).toMatch(/SPEED:\s*2/i)


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

// Helper function, to find an Enzyme element by text
function findByText (wrapper, text) {
  return wrapper.findWhere(node => (
    node.type() &&
    node.text() === text
  ));
}