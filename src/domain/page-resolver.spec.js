import { PAGE_NAME } from './page-name.js';
import PageResolver from './page-resolver.js';
import DefaultSiteLogo from '../components/default-site-logo.js';
import DefaultPageTemplate from '../components/default-page-template.js';

const allPageNames = Object.values(PAGE_NAME);

function MyTemplateComponent() {}
function MySiteLogoComponent() {}
function MyHomePageLogoComponent() {}

describe('page-resolver', () => {

  describe('getPageComponentInfo', () => {

    allPageNames.forEach(pageName => {
      describe(`when called for page '${pageName}'`, () => {
        it('resolves the components', async () => {
          const sut = new PageResolver({
            getPageTemplateComponent: () => null,
            getHomePageLogoComponent: () => null,
            getSiteLogoComponent: () => null
          });

          const {
            PageComponent,
            HomePageLogoComponent,
            SiteLogoComponent
          } = await sut.getPageComponentInfo(pageName);

          expect(PageComponent).toBeInstanceOf(Function);
          expect(HomePageLogoComponent).toBeInstanceOf(Function);
          expect(SiteLogoComponent).toBeInstanceOf(Function);
        });
      });
    });

    describe('when called for page with a bundle config that returns null for all components', () => {
      it('resolves the default components', async () => {
        const sut = new PageResolver({
          getPageTemplateComponent: () => null,
          getHomePageLogoComponent: () => null,
          getSiteLogoComponent: () => null
        });

        const {
          PageTemplateComponent,
          HomePageLogoComponent,
          SiteLogoComponent
        } = await sut.getPageComponentInfo(PAGE_NAME.index);

        expect(PageTemplateComponent).toBe(DefaultPageTemplate);
        expect(HomePageLogoComponent).toBe(DefaultSiteLogo);
        expect(SiteLogoComponent).toBe(DefaultSiteLogo);
      });
    });

    describe('when called for page with a bundle config that returns components', () => {
      it('resolves the configured components', async () => {
        const sut = new PageResolver({
          getPageTemplateComponent: () => Promise.resolve(MyTemplateComponent),
          getHomePageLogoComponent: () => Promise.resolve(MyHomePageLogoComponent),
          getSiteLogoComponent: () => Promise.resolve(MySiteLogoComponent)
        });

        const {
          PageTemplateComponent,
          HomePageLogoComponent,
          SiteLogoComponent
        } = await sut.getPageComponentInfo(PAGE_NAME.index);

        expect(PageTemplateComponent).toBe(MyTemplateComponent);
        expect(HomePageLogoComponent).toBe(MyHomePageLogoComponent);
        expect(SiteLogoComponent).toBe(MySiteLogoComponent);
      });
    });

  });

  describe('getCachedPageComponentInfo', () => {

    describe('when called without prefilling the cache upfront', () => {
      it('throws an error', () => {
        const sut = new PageResolver({
          getPageTemplateComponent: () => null,
          getHomePageLogoComponent: () => null,
          getSiteLogoComponent: () => null
        });
        expect(() => sut.getCachedPageComponentInfo(PAGE_NAME.index)).toThrow();
      });
    });

    allPageNames.forEach(pageName => {
      describe(`when called for page '${pageName}'`, () => {
        it('resolves the components', async () => {
          const sut = new PageResolver({
            getPageTemplateComponent: () => null,
            getHomePageLogoComponent: () => null,
            getSiteLogoComponent: () => null
          });
          await sut.prefillCache();

          const {
            PageComponent,
            HomePageLogoComponent,
            SiteLogoComponent
          } = sut.getCachedPageComponentInfo(pageName);

          expect(PageComponent).toBeInstanceOf(Function);
          expect(HomePageLogoComponent).toBeInstanceOf(Function);
          expect(SiteLogoComponent).toBeInstanceOf(Function);
        });
      });
    });

    describe('when called for page with a bundle config that returns null for all components', () => {
      it('resolves the default components', async () => {
        const sut = new PageResolver({
          getPageTemplateComponent: () => null,
          getHomePageLogoComponent: () => null,
          getSiteLogoComponent: () => null
        });
        await sut.prefillCache();

        const {
          PageTemplateComponent,
          HomePageLogoComponent,
          SiteLogoComponent
        } = sut.getCachedPageComponentInfo(PAGE_NAME.index);

        expect(PageTemplateComponent).toBe(DefaultPageTemplate);
        expect(HomePageLogoComponent).toBe(DefaultSiteLogo);
        expect(SiteLogoComponent).toBe(DefaultSiteLogo);
      });
    });

    describe('when called for page with a bundle config that returns components', () => {
      it('resolves the configured components', async () => {
        const sut = new PageResolver({
          getPageTemplateComponent: () => Promise.resolve(MyTemplateComponent),
          getHomePageLogoComponent: () => Promise.resolve(MyHomePageLogoComponent),
          getSiteLogoComponent: () => Promise.resolve(MySiteLogoComponent)
        });
        await sut.prefillCache();

        const {
          PageTemplateComponent,
          HomePageLogoComponent,
          SiteLogoComponent
        } = sut.getCachedPageComponentInfo(PAGE_NAME.index);

        expect(PageTemplateComponent).toBe(MyTemplateComponent);
        expect(HomePageLogoComponent).toBe(MyHomePageLogoComponent);
        expect(SiteLogoComponent).toBe(MySiteLogoComponent);
      });
    });

  });

});
