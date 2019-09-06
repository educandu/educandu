const React = require('react');

const { useContext } = React;

const requestContext = React.createContext();

function useRequest() {
  return useContext(requestContext);
}

function withRequest(Component) {
  return function RequestInjector(props) {
    const request = useContext(requestContext);
    return <Component {...props} request={request} />;
  };
}

module.exports = {
  RequestProvider: requestContext.Provider,
  withRequest: withRequest,
  useRequest: useRequest
};
