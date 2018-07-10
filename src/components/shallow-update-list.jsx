const React = require('react');
const PropTypes = require('prop-types');
const shallowEqualArrays = require('shallow-equal/arrays');

/*

  List that only rerenders when the list or one of the items have changed,
  compared by reference. Use it like so:

  <ShallowUpdateList items={[{ id: 'a', val: 'aa' }, { id: 'b', val: 'bb' }]}>
    {(item, index) => (
      <p key={item.id}>Found value {item.val} on index {index}</p>
    )}
  </ShallowUpdateList>

*/

class ShallowUpdateList extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !shallowEqualArrays(this.props.items, nextProps.items);
  }

  render() {
    const { items, children } = this.props;
    return items.map(children);
  }
}

ShallowUpdateList.propTypes = {
  children: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired
};

module.exports = ShallowUpdateList;
