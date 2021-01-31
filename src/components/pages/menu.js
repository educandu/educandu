import React from 'react';
import Page from '../page';
import autoBind from 'auto-bind';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import classnames from 'classnames';
import { withTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { menuShape, documentMetadataShape, documentShape, translationProps } from '../../ui/default-prop-types';

class Menu extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);

    const { initialState } = this.props;

    this.state = {
      documentDictionary: initialState.documents.reduce((map, doc) => {
        map.set(doc.key, doc);
        return map;
      }, new Map())
    };
  }

  handleEditMenuClick() {
    const { initialState } = this.props;
    const menuEditUrl = urls.getEditMenuUrl(initialState.menu._id);
    window.location = menuEditUrl;
  }

  renderDefaultDoc(defaultDocument) {
    return (
      <div className="MenuPage-detailsItem">
        <DocView documentOrRevision={defaultDocument} />
      </div>
    );
  }

  hasNodeAnyDocuments(node) {
    if (node.documentKeys.length) {
      return true;
    }

    if (node.children.length) {
      return node.children.some(child => this.hasNodeAnyDocuments(child));
    }

    return false;
  }

  renderMenuItemList(nodes, level, documentDictionary) {
    return (
      <div className="Content">
        <ul className="MenuPage-categoryList">
          {nodes.filter(node => this.hasNodeAnyDocuments(node)).map(node => (
            <li key={node.key}>
              <div className={classnames(['MenuPage-categoryListItem', `u-level-${level}`])}>
                {this.renderLinkList(node, level, documentDictionary)}
              </div>
              {!!node.children.length && this.renderMenuItemList(node.children, level + 1, documentDictionary)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  renderLinkList(node, level, documentDictionary) {
    const docs = node.documentKeys.map(key => documentDictionary.get(key));
    return (
      <div key={node.key} className={classnames(['MenuPage-detailsItem', `u-level-${level}`])}>
        <h3 className={classnames(['MenuPage-linkListTitle', `u-level-${level}`])}>{node.title}</h3>
        {!!docs.length && (
          <ul className="MenuPage-linkList">
            {docs.map(doc => {
              return (
                <li
                  key={doc.key}
                  className="MenuPage-linkListItem"
                  >
                  {this.renderLinkListItemContent(doc)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  renderLinkListItemContent(doc) {
    const { t } = this.props;
    const title = doc.title || t('unknownDocumentTitle');
    return doc.slug
      ? <a href={urls.getArticleUrl(doc.slug)}>{title}</a>
      : <span>{title}</span>;
  }

  render() {
    const { initialState, t } = this.props;
    const { documentDictionary } = this.state;
    const { menu, defaultDocument } = initialState;

    const headerActions = [
      {
        key: 'edit',
        type: 'primary',
        icon: EditOutlined,
        text: t('common:edit'),
        permission: permissions.EDIT_MENU,
        handleClick: this.handleEditMenuClick
      }
    ];

    return (
      <Page headerActions={headerActions}>
        <div className="MenuPage">
          <div className="Content">
            <h2>{menu.title}</h2>
          </div>
          {defaultDocument ? this.renderDefaultDoc(defaultDocument) : null}
          {this.renderMenuItemList(menu.nodes, 0, documentDictionary)}
        </div>
      </Page>
    );
  }
}

Menu.propTypes = {
  ...translationProps,
  initialState: PropTypes.shape({
    defaultDocument: documentShape,
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired,
    menu: menuShape.isRequired
  }).isRequired
};

export default withTranslation('menu')(Menu);
