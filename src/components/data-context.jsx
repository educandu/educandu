const React = require('react');

const { Consumer, Provider } = React.createContext();

function withData(Component) {
  function InjectingComponent(props) {
    return (
      <Consumer>
        {data => <Component {...props} data={data} />}
      </Consumer>
    );
  }

  return InjectingComponent;
}

module.exports = {
  DataProvider: Provider,
  withData: withData
};
