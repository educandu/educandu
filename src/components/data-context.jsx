const React = require('react');

const { useContext } = React;

const dataContext = React.createContext();

function withData(Component) {
  return function DataInjector(props) {
    const data = useContext(dataContext);
    return <Component {...props} data={data} />;
  };
}

module.exports = {
  DataProvider: dataContext.Provider,
  withData: withData
};
