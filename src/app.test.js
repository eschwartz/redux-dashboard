import App from './components/App/App';
import Dashboard from './components/Dashboard/Dashboard';
import Passengers from './components/Passengers/Passengers';
import SpeedControl from './components/SpeedControl/SpeedControl';
import React from 'react';
import { shallow, mount } from 'enzyme';
import {default as waitFor} from 'wait-for-expect';
import {storeInstance as getStore} from './index'
import { Provider } from 'react-redux';

// Mock react-dom, so we can import `index.js`
// without actually rendering the app to the DOM.
// See __mocks__/react-dom.js
// https://jestjs.io/docs/en/manual-mocks#mocking-node-modules
jest.mock('react-dom');

// Recreate store between each test
let store;
beforeEach(() => store = getStore());

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

  // Find the "Increase/Decrease Speed" Buttons
  let increaseButton = findIncreaseSpeedButton(speedControl);
  let decreaseButton = findDecreaseSpeedButton(speedControl);


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
  ).toMatch(/SPEED:\s*2/i);
});

it('Speed: Value of speed is held in redux state', async() => {
  let speedControl = mountWithStore(SpeedControl);

  // Iterate through the state, and look for a `speed=0` value
  let reduxSpeedKey = Object.keys(store.getState())
    // Hopefully they named their redux key something like "speed"
    // or "currentSpeed" or ....
    .find(key => /speed/i.test(key))
  

  // TODO: what if they nest their speed inside an object?
  // could dive deeper, or could just include a hint to not do that
  // ...what if they use a weird name for their key? Or mispell speed?
  // 
  // For now, we'll leave a hint, pointing them in the right direction.

  // Check that there is a `speed` value in the redux store
  expect(
    reduxSpeedKey,
    `Couldn't find a property in the redux state for the speed. 
     For best results, name your reducer something like \`speed\`, 
     \`currentSpeed\` or \`speedReducer\`
    `
  ).toBeDefined();

  // Check that redux.speed = 0, on init
  expect(
    store.getState()[reduxSpeedKey],
    `Expecting the initial value of \`reduxState.${reduxSpeedKey}\` to be zero.
     Make sure your speed reducer is returning a number! (not an object)
     and that you're defining a default state`
  ).toBe(0);

  // Find the "Increase/Decrease Speed" Buttons
  let increaseButton = findIncreaseSpeedButton(speedControl);
  let decreaseButton = findDecreaseSpeedButton(speedControl);

  // Click the "Increase Speed" button 4x times
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');
  increaseButton.last().simulate('click');

  // Check that reduxState.speed = 4, after clicking "increase" x 4
  expect(
    store.getState()[reduxSpeedKey],
    `Increase the value of \`reduxState.${reduxSpeedKey}\` by 1, whenever you click "Increase Speed"`
  ).toBe(4);

  // Click the "Decrease Speed" button 2x times
  decreaseButton.last().simulate('click');
  decreaseButton.last().simulate('click');

  // Check that reduxState.speed = 2, after clicking "decrease" x 2
  expect(
    store.getState()[reduxSpeedKey],
    `Decrease the value of \`reduxState.${reduxSpeedKey}\` by 1, whenever you click "Decrease Speed"`
  ).toBe(2);
});

it('Passengers: Default entry with your name', async() => {
  let passengers = mountWithStore(Passengers);

  expect(
    passengers.find('li').length,
    'Expecting a single `<li>` element with your name in the `<Passengers />` component'
  ).toBe(1);

  expect(
    /\w+/.test(passengers.find('li').text()),
    'The `<li>` in `<Passengers />` should render your name (it appears to be empty!)'
  ).toBe(true);
});

/**
Tests:

 Functional requirements
x Speed: should start at 0
x Speed: Increase / Decrease buttons update speed on DOM
- Passenger: Default entry with your name
- Passenger: Adding a passenger shows them in the DOM
- Passenger: Add a passenger
- Dashboard: Show current speed
- Dashboard: Show passenger count

Technical requirements
x Components use `connect()` to talk to redux
x Speed held in redux state
- Passenger held in redux state
x Speed has default values in redux
- Passnger has default values in redux
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

function findIncreaseSpeedButton(wrapper) {
  let increaseButton = findByText(wrapper, 'Increase Speed');
  expect(
    increaseButton.length,
    'Make sure you have a single button that says "Increase Speed"'
  ).toBe(1);

  return increaseButton;
}

function findDecreaseSpeedButton(wrapper) {
  let decreaseButton = findByText(wrapper, 'Decrease Speed');
  expect(
    decreaseButton.length,
    'Make sure you have a single button that says "Decrease Speed"'
  ).toBe(1);

  return decreaseButton;
}