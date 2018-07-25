const React = require('react');

const { Consumer, Provider } = React.createContext();

function withUser(Component) {
  function InjectingComponent(props) {
    return (
      <Consumer>
        {user => <Component {...props} user={user} />}
      </Consumer>
    );
  }

  return InjectingComponent;
}

module.exports = {
  UserProvider: Provider,
  withUser: withUser
};
