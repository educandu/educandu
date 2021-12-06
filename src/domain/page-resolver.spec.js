import Page from '../components/page.js';
import { PAGE_NAME } from './page-name.js';
import PageResolver from './page-resolver.js';

const allPageNames = Object.values(PAGE_NAME);

function MyTemplateComponent() {}

describe('page-resolver', () => {

  describe('getPageComponentInfo', () => {

    allPageNames.forEach(pageName => {
      describe(`when called for page '${pageName}'`, () => {
        it('resolves the page component', async () => {
          const sut = new PageResolver({ getPageTemplateComponent: () => null });
          const { PageComponent } = await sut.getPageComponentInfo(pageName);
          expect(PageComponent).toBeInstanceOf(Function);
        });
      });
    });

    describe('when called for page with a bundle config that returns null for the page template', () => {
      it('resolves the default page template component', async () => {
        const sut = new PageResolver({ getPageTemplateComponent: () => null });
        const { PageTemplateComponent } = await sut.getPageComponentInfo(PAGE_NAME.index);
        expect(PageTemplateComponent).toBe(Page);
      });
    });

    describe('when called for page with a bundle config that returns a component for the page template', () => {
      it('resolves the configured page template component', async () => {
        const sut = new PageResolver({ getPageTemplateComponent: () => Promise.resolve(MyTemplateComponent) });
        const { PageTemplateComponent } = await sut.getPageComponentInfo(PAGE_NAME.index);
        expect(PageTemplateComponent).toBe(MyTemplateComponent);
      });
    });

  });

  describe('getCachedPageComponentInfo', () => {

    describe('when called without prefilling the cache upfront', () => {
      it('throws an error', () => {
        const sut = new PageResolver({ getPageTemplateComponent: () => null });
        expect(() => sut.getCachedPageComponentInfo(PAGE_NAME.index)).toThrow();
      });
    });

    allPageNames.forEach(pageName => {
      describe(`when called for page '${pageName}'`, () => {
        it('resolves the page component', async () => {
          const sut = new PageResolver({ getPageTemplateComponent: () => null });
          await sut.prefillCache();
          const { PageComponent } = sut.getCachedPageComponentInfo(pageName);
          expect(PageComponent).toBeInstanceOf(Function);
        });
      });
    });

    describe('when called for page with a bundle config that returns null for the page template', () => {
      it('resolves the default page template component', async () => {
        const sut = new PageResolver({ getPageTemplateComponent: () => null });
        await sut.prefillCache();
        const { PageTemplateComponent } = sut.getCachedPageComponentInfo(PAGE_NAME.index);
        expect(PageTemplateComponent).toBe(Page);
      });
    });

    describe('when called for page with a bundle config that returns a component for the page template', () => {
      it('resolves the configured page template component', async () => {
        const sut = new PageResolver({ getPageTemplateComponent: () => Promise.resolve(MyTemplateComponent) });
        await sut.prefillCache();
        const { PageTemplateComponent } = sut.getCachedPageComponentInfo(PAGE_NAME.index);
        expect(PageTemplateComponent).toBe(MyTemplateComponent);
      });
    });

  });

});
