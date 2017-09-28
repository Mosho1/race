import render from './app';

render();

if (__DEVELOPMENT__ && module.hot) {
  module.hot.accept(['./app'], () => {
    render();
  });
}