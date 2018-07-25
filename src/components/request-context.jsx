const React = require('react');

const { Consumer, Provider } = React.createContext();

function withRequest(Component) {
  function InjectingComponent(props) {
    return (
      <Consumer>
        {request => <Component {...props} request={request} />}
      </Consumer>
    );
  }

  return InjectingComponent;
}

module.exports = {
  RequestProvider: Provider,
  withRequest: withRequest
};
