import render from './app';

let un = render();

if (__DEVELOPMENT__ && module.hot) {
  module.hot.accept(['./app'], () => {
    un();
    un = render();
  });
}