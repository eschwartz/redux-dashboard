import App from './components/App/App';
import Dashboard from './components/Dashboard/Dashboard';
import Passengers from './components/Passengers/Passengers';
import SpeedControl from './components/SpeedControl/SpeedControl';
import React from 'react';
import { mount } from 'enzyme';
import {storeInstance as getStore} from './index'
import { Provider } from 'react-redux';
import {MemoryRouter} from 'react-router';
import validateHTML from 'html-validator';
import {execSync} from 'child_process';

// Mock react-dom, so we can import `index.js`
// without actually rendering the app to the DOM.
// See __mocks__/react-dom.js
// https://jestjs.io/docs/en/manual-mocks#mocking-node-modules
jest.mock('react-dom');

let store;
let originalInitState = JSON.stringify(getStore().getState());

beforeEach(() => {
  // Recreate store between each test
  store = getStore()

  // If a reducer's initial state is defined outside the function definition,
  // and then mutated, it will effect the initial state of the redux store
  // in subsequent tests.
  //
  // eg:
  //
  // let initialSpeed = { speed: 0 }
  // function speedReducer(state = initialSpeed, action) {
  //   state.speed += 1;    // <-- mutates initialSpeed!
  //   return state
  // }
  //
  // There's no easy way to "reset" the state, so we'll just check
  // if the state has changed, and warn the user about it.
  let initState = JSON.stringify(store.getState());
  expect(
    initState,
    `WARNING: Your redux state has been mutated! 
     Subsequent tests may fail with misleading messages.
     
     Avoid using \`Array.push()\`, \`+=\`, or \`-=\` operations on state.`
  ).toBe(originalInitState);
});

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
  let app = mountWithStore(App);
  app = clickLink(app, 'Speed Control');

  expect(
    app.text(),
    'Speed Control component should render "SPEED: 0" on initial load',
  ).toMatch(/0/)
});

it('Speed: Increase/Decrease buttons should update the speed on the DOM', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Speed Control');

  // Find the "Increase/Decrease Speed" Buttons
  let increaseButton = findIncreaseSpeedButton(app);
  let decreaseButton = findDecreaseSpeedButton(app);


  // Click the "Increase Speed" button 4x times
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Should render "SPEED: 4"
  expect(
    app.update().text(),
    'Should render "SPEED: 4" after clicking "Increase Speed" 4x times',
  ).toMatch(/4/i)

  // Click the "Decrease Speed" button 4x times
  decreaseButton.simulate('click');
  decreaseButton.simulate('click');

  // Should render "SPEED: 2"
  expect(
    app.update().text(),
    'Should render correct speed after clicking the "Decrease Speed" button',
  ).toMatch(/2/i);
});

it('Speed: Value of speed is held in redux state', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Speed Control');

  // Iterate through the state, and look for a `speed=0` value
  let reduxSpeedKey = Object.keys(store.getState())
    // Hopefully they named their redux key something like "speed"
    // or "currentSpeed" or ....
    .find(key => /speed|count/i.test(key))

  // Students might keep the `speed` as a number, as an object, or as an array
  // Sniff the speed data type, and try to pull out the actual numeric value
  // This won't catch *all* the weird ways students may represent their speed,
  // but should catch the bulk of them.
  let getReduxSpeed;
  let currentReduxVal = store.getState()[reduxSpeedKey];
  // If it's an array, grab the first item
  if (Array.isArray(currentReduxVal)) {
    getReduxSpeed = () => store.getState()[reduxSpeedKey][0];
  }
  // If it's an object, grab the first value from the object
  else if (typeof currentReduxVal === 'object' && !!currentReduxVal) {
    getReduxSpeed = () => Object.values(store.getState()[reduxSpeedKey])[0];
  }
  // Otherwise, assume it's a number
  else {
    getReduxSpeed = () => store.getState()[reduxSpeedKey];
  }

  // Check that there is a `speed` value in the redux store
  expect(
    reduxSpeedKey,
    `Couldn't find a property in the redux state for the speed. 
     Try naming your reducer something like \`speed\`, 
     \`currentSpeed\` or \`speedReducer\`
    `
  ).toBeDefined();

  // Check that redux.speed = 0, on init
  expect(
    getReduxSpeed(),
    `Expecting the initial value of \`reduxState.${reduxSpeedKey}\` to be zero.
     Make sure your speed reducer is returning a number! (not an object)
     and that you're defining a default state`
  ).toBe(0);

  // Find the "Increase/Decrease Speed" Buttons
  let increaseButton = findIncreaseSpeedButton(app);
  let decreaseButton = findDecreaseSpeedButton(app);

  // Click the "Increase Speed" button 4x times
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Check that reduxState.speed = 4, after clicking "increase" x 4
  expect(
    getReduxSpeed(),
    `Increase the value of \`reduxState.${reduxSpeedKey}\` by 1, whenever you click "Increase Speed"`
  ).toBe(4);

  // Click the "Decrease Speed" button 2x times
  decreaseButton.simulate('click');
  decreaseButton.simulate('click');

  // Check that reduxState.speed = 2, after clicking "decrease" x 2
  expect(
    getReduxSpeed(),
    `Decrease the value of \`reduxState.${reduxSpeedKey}\` by 1, whenever you click "Decrease Speed"`
  ).toBe(2);
});


it('Passengers: Adding a passenger shows them in the DOM', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  // Enter a name into the input
  simulateChange(app.find('input'), 'Dev Jana');

  // Click the "Add Passenger" button
  app.find('button').simulate('click');

  // Check that passenger was added inside the <ul />
  let lastItem = findPassengerList(app.update()).last();
  expect(
    lastItem.length,
    'Couldn\'t find an `<li>` element for the new passenger'
  ).toBe(1);
  expect(
    lastItem.text().trim(),
    'New passenger should be added inside a `<li>`'
  ).toBe('Dev Jana');
});

it('Passengers: Passenger list is kept in redux state', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  // Find the passengers state in redux

  // Remember how many passengers we started with,
  let initPassengerCount = getPassengersState(store).length;

  // Add a passenger, via the form
  simulateChange(app.find('input'), 'Dev Jana');
  app.find('button').simulate('click');

  // Check that an item is added to the 
  // redux.passengers array
  expect(
    getPassengersState(store).length,
    'Should add a passenger to redux state'
  ).toBe(initPassengerCount + 1);
});

it('Dashboard: show current speed', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Speed Control');

  // Click the  "Increase speed" x 2
  let increaseButton = findIncreaseSpeedButton(app);
  increaseButton.simulate('click');
  increaseButton.simulate('click');

  // Navigate to Dashboard
  clickLink(app, 'Dashboard');

  // Dashboard should show the updated speed
  let dashboard = app.update().find('Dashboard');
  expect(
    dashboard.text(),
    'Dashboard should render "SPEED: 2" when you click "Increase Speed" twice'
  ).toMatch(/SPEED:\s+2/i);
});

it('Dashboard: show passenger count', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  // Add a couple passengers
  let passengers = app.find('Passengers');
  
  simulateChange(passengers.find('input'), 'Dev Jana');
  passengers.find('button').simulate('click');

  simulateChange(passengers.find('input'), 'Edan Schwartz');
  passengers.find('button').simulate('click');

  // Count how many passengers we have now.
  // Could be 2 or 3, depending on whether they
  // remembered to include themselves as a default passenger
  let passengerCount = findPassengerList(app.update().find('Passengers')).length;
  expect(
    passengerCount,
    `Adding a passenger should render some \`<li>\`s to the \`<Passengers />\` component`
  ).toBeGreaterThanOrEqual(2);

  // Navigate to the dashboard
  clickLink(app, 'Dashboard');

  // Dashboard should show the updated speed
  let dashboard = app.update().find('Dashboard');
  expect(
    dashboard.text(),
    'Dashboard should render the updated "PASSENGER COUNT" when you add a passenger'
  ).toMatch(new RegExp(`PASSENGER.*:\\s*${passengerCount}`, 'i'));
});

it('Reducers should not mutate state', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  // Grab the passengers list from the redux state
  let prevPassengersState = getPassengersState(store);

  // Add a couple of passengers
  simulateChange(app.find('input'), 'Dev Jana');
  app.find('button').simulate('click');
  simulateChange(app.find('input'), 'Edan Schwartz');
  app.find('button').simulate('click');

  // Grab the updated store.passengers value
  let nextPassengersState = getPassengersState(store);

  // Our new passenger state should be a different
  // object that our previous one
  // (this will fail if students use `[].push()`, for eg)
  expect(
    nextPassengersState,
    `Each call to the passengers reducer should return a brand new array.
     Trying using the spread operator (\`...\`), instead of \`[].push()\`
    `
  ).not.toBe(prevPassengersState);
});

it('[GENERAL] Passengers: Default entry with your name', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  let passengerItems = app.find('ul').children('*');

  expect(
    passengerItems.length,
    'Expecting a single `<li>` element with your name in the `<Passengers />` component'
  ).toBe(1);

  expect(
    /\w+/.test(passengerItems.text()),
    'The `<li>` in `<Passengers />` should render your name (it appears to be empty!)'
  ).toBe(true);
});

it('[GENERAL] Passengers: New Passenger input is emptied, after adding to list', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Passengers');

  // Enter a name into the input
  simulateChange(app.find('input'), 'Dev Jana');

  // Click the "Add Passenger" button
  app.find('button')
    .simulate('click');

  expect(
    app.update().find('input').instance().value,
    'Empty the <input /> value, on button click.'
  ).toBe('');

});

it('[GENERAL] HTML is valid', async() => {
  let app = mountWithStore(App);
  app = clickLink(app, 'Speed Control');

  // Validate landing page (Speed Control)
  await expectValidHTML(app, 'Speed Control View');

  // Navigate to Passengers view
  clickLink(app, 'Passengers');

  // Add a couple passengers
  let passengers = app.update().find('Passengers');
  try {
    simulateChange(passengers.find('input'), 'Dev Jana');
    passengers.find('button').simulate('click');
  
    simulateChange(passengers.find('input'), 'Edan Schwartz');
    passengers.find('button').simulate('click');
  }
  catch (err) {
    // Don't let the failure of adding passengers
    // make HTML validation fail
    // (it's tested elsewhere)
  }

  // Validate Passengers HTML
  await expectValidHTML(app, 'Passengers view')

  // Navigate to Dashboard
  clickLink(app, 'Dashboard');

  // Validate Dashboard HTML
  await expectValidHTML(app, 'Dashboard');
});

it('[GENERAL] At least 2 commits', async() => {
  // Count the number of commits in the last 24 hours. 
  // This may not work 100%, eg. if Prime staff have updated the assignment recently.
  let commitCount = execSync('git log --oneline --since="1 day ago" | wc -l', {
    encoding: 'utf8'
  }).trim();

  expect(
    Number(commitCount),
    `Commit early and often! (You have ${commitCount} commits)`
  ).toBeGreaterThanOrEqual(2);
});

async function expectValidHTML(wrapper, name='App') {
  // https://github.com/zrrrzzt/html-validator
  let res;
  try {
    res = await validateHTML({
      validator: 'WHATWG',
      data: wrapper.update().html(),
      isFragment: true
    });
  }
  catch (err) {
    expect(
      err,
      `HTML Validation of ${name} failed.`
    ).toBeUndefined()
  }

  // Remove duplicate errors 
  let uniqueErrors = [...new Set(res.errors.map(e => e.message))]
  expect(
    res.isValid,
    `${name} has invalid HTML: 
     ${uniqueErrors.join(';\n')}`
  ).toBe(true);
}


function mountWithStore(Component) {
  // If the component is wrapped in a Redux <Connect />,
  // we want to dive deeper into the actual component.
  let componentName = Component.WrappedComponent ?
    Component.WrappedComponent.name :
    Component.name;

  let provider;
  try {
    provider = mount(
      <MemoryRouter>
        <Provider store={store}>
          {React.createElement(Component)}
        </Provider>
      </MemoryRouter>
    );
  }
  catch (err) {
    expect(false, `Failed to render <${componentName} />: ${err}`)
      .toBe(true)
  }

  // Find the actual component
  return provider.find(componentName);
}

// Helper function, to find an Enzyme element by text
function findByText (wrapper, text) {
  let re = text instanceof RegExp ? text : new RegExp(text)
  return wrapper.findWhere(node => (
    node.type() &&
    re.test(node.text())
  )).last();
}

function findIncreaseSpeedButton(wrapper) {
  let increaseButton = findByText(wrapper, /^Increase Speed$/i);
  expect(
    increaseButton.length,
    'Make sure you have a single button that says "Increase Speed"'
  ).toBe(1);

  return increaseButton.last();
}

function findDecreaseSpeedButton(wrapper) {
  let decreaseButton = findByText(wrapper, /^Decrease Speed$/i);
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

  return wrapper.update();
}

function getPassengersState(store) {
  // Iterate through the redux state,
  // and look for a key called "passengers*"
  let reduxKey = Object.keys(store.getState())
    .find(key => /(passenger|person|people|name|list)/i.test(key));

  // Check that theres a "passenger*" key in the redux state
  expect(
    reduxKey,
    `Couldn't find a property in the redux state to track passengers. 
     Try naming your reducer something like \`passengers\`, 
     \`passengerList\` or \`passengerReducer\``
  ).toBeDefined();

  let passengerList = store.getState()[reduxKey];
  // The passenger list might be wrapped in an object
  // like { passengers: ['A', 'B', 'C'] }
  if (passengerList && !Array.isArray(passengerList) && typeof passengerList === 'object') {
    passengerList = Object.values(passengerList)[0];
  }

  // Check that redux.passengers is an array, on init
  expect(
    Array.isArray(passengerList),
    `\`reduxState.${reduxKey}\` should return an array
     as a default value`
  ).toBe(true);

  return passengerList;
}

function findPassengerList(wrapper) {
  // Look in a few different places for passengers.
  // We're being forgiving here, for bad HTML
  // (note that we test HTML separately as a GENERAL item)

  // Try finding any element inside the <ul>
  let passengers = wrapper.find('ul').children('*');
  if (passengers.length) {
    return passengers;
  }

  // Try finding <li> items elsewhere on the page
  return wrapper.find('li');
}