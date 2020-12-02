import App from './components/App/App';
import Dashboard from './components/Dashboard/Dashboard';
import Passengers from './components/Passengers/Passengers';
import SpeedControl from './components/SpeedControl/SpeedControl';
import React from 'react';
import { shallow, mount } from 'enzyme';
import {default as waitFor} from 'wait-for-expect';
import {storeInstance as getStore} from './index'
import { Provider } from 'react-redux';
import {MemoryRouter} from 'react-router';

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
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Should render "SPEED: 4"
  expect(
    speedControl.text(),
    'Should render "SPEED: 4" after clicking "Increase Speed" 4x times',
  ).toMatch(/SPEED:\s*4/i)

  // Click the "Decrease Speed" button 4x times
  decreaseButton.simulate('click');
  decreaseButton.simulate('click');

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
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Check that reduxState.speed = 4, after clicking "increase" x 4
  expect(
    store.getState()[reduxSpeedKey],
    `Increase the value of \`reduxState.${reduxSpeedKey}\` by 1, whenever you click "Increase Speed"`
  ).toBe(4);

  // Click the "Decrease Speed" button 2x times
  decreaseButton.simulate('click');
  decreaseButton.simulate('click');

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

it('Passengers: Adding a passenger shows them in the DOM', async() => {
  let passengers = mountWithStore(Passengers);

  // Enter a name into the input
  simulateChange(passengers.find('input'), 'Dev Jana');

  // Click the "Add Passenger" button
  passengers.find('button').simulate('click');

  // Check that passenger was added in an <li />
  let lastItem = passengers.update().find('li').last();
  expect(
    lastItem.text().trim(),
    'New passenger should be added inside a `<li>`'
  ).toBe('Dev Jana');
});

it('[GENERAL] Passengers: New Passenger input is emptied, after adding to list', async() => {
  let passengers = mountWithStore(Passengers);

  // Enter a name into the input
  simulateChange(passengers.find('input'), 'Dev Jana');

  // Click the "Add Passenger" button
  passengers.find('button')
    .simulate('click');

  passengers.update();
  expect(
    passengers.find('input').instance().value,
    'Empty the <input /> value, on button click.'
  ).toBe('');

});

it('Passengers: Passenger list is kept in redux state', async() => {
  let passengers = mountWithStore(Passengers);

  // Iterate through the redux state,
  // and look for a key called "passengers*"
  let reduxKey = Object.keys(store.getState())
    // Hopefully they named their redux key something like "speed"
    // or "currentSpeed" or ....
    .find(key => /passenger/i.test(key));

  // Check that theres a "passenger*" key in the redux state
  expect(
    reduxKey,
    `Couldn't find a property in the redux state for the speed. 
     For best results, name your reducer something like \`passengers\`, 
     \`passengerList\` or \`passengerReducer\``
  ).toBeDefined();

  // Check that redux.passengers is an array, on init
  expect(
    Array.isArray(store.getState()[reduxKey]),
    `\`reduxState.${reduxKey}\` should return an array
     as a default value`
  ).toBe(true);

  // Remember how many passengers we started with,
  let initPassengerCount = store.getState()[reduxKey].length;

  // Add a passenger, via the form
  simulateChange(passengers.find('input'), 'Dev Jana');
  passengers.find('button').simulate('click');

  // Check that an item is added to the 
  // redux.passengers array
  expect(
    store.getState()[reduxKey].length,
    'Should add a passenger to redux state'
  ).toBe(initPassengerCount + 1);
});

it('Dashboard: show current speed', async() => {
  let app = mountWithStore(App);

  // Click the  "Increase speed" x 2
  let increaseButton = findIncreaseSpeedButton(app);
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Navigate to Dashboard
  clickLink(app, 'Dashboard');

  let dashboard = app.update().find('Dashboard');
  expect(
    dashboard.text(),
    'Dashboard should render "SPEED: 2" when you click "Increase Speed" twice'
  ).toMatch(/SPEED:\s+2/i);
});



/**
Tests:

 Functional requirements
x Speed: should start at 0
x Speed: Increase / Decrease buttons update speed on DOM
x Passenger: Default entry with your name
x Passenger: Adding a passenger shows them in the DOM
x Passenger: Add a passenger
- Dashboard: Show current speed
- Dashboard: Show passenger count

Technical requirements
x Components use `connect()` to talk to redux
x Speed held in redux state
x Passenger held in redux state
x Speed has default values in redux
x Passenger has default values in redux
? Passenger count is _not_ held in redux state (should do "math" in component)
- Reducers do not mutate state (ie. use spread operator)
 */


function mountWithStore(Component) {
  let provider = mount(
    <MemoryRouter>
      <Provider store={store}>
        {React.createElement(Component)}
      </Provider>
    </MemoryRouter>
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

  return increaseButton.last();
}

function findDecreaseSpeedButton(wrapper) {
  let decreaseButton = findByText(wrapper, 'Decrease Speed');
  expect(
    decreaseButton.length,
    'Make sure you have a single button that says "Decrease Speed"'
  ).toBe(1);

  return decreaseButton.last();
}

function simulateChange(input, value) {
  // Simulate the change event
  input.simulate('change', { 
    target: { value } 
  });

  // Update the value of the `input` element
  input.instance().value = value;

  return input;
}

function clickLink(wrapper, linkText) {
  let link = wrapper.findWhere(node => (
      node.type() &&
      node.name() === 'a' &&
      node.text() === linkText
    ));

  expect(
    link.length,
    `Failed to find a link with text "${linkText}" inside ${wrapper.name()}`
  ).toBe(1);

  // https://github.com/enzymejs/enzyme/issues/516
  link.simulate('click', { button: 0 });
}