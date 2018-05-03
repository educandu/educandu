const uniqueId = require('./src/utils/unique-id');
const Database = require('./src/stores/database');
const bootstrapper = require('./src/bootstrapper');
const DocumentService = require('./src/services/document-service');

const section1 = `
# Lorem ipsum

## Nam interdum magna eu pretium laoreet

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum commodo eros non augue vestibulum, vitae pellentesque nunc gravida. Nullam id elit quis arcu accumsan malesuada a non arcu. Aliquam bibendum turpis urna, nec tempor metus laoreet a. Cras consequat ex id tincidunt auctor. Aenean non elementum dolor. Morbi facilisis, ex et faucibus elementum, risus odio hendrerit justo, et ultricies libero risus a eros. Pellentesque eu auctor diam. Etiam quis odio sed mauris gravida porta sed sit amet nisi. Sed scelerisque tincidunt mattis. Donec vel orci faucibus, molestie nisi in, feugiat arcu. Nullam tincidunt sapien leo, convallis mollis neque accumsan at. Mauris vel placerat orci. Nam rutrum ullamcorper orci et scelerisque. Cras commodo ipsum purus, et venenatis leo lobortis quis.

Etiam facilisis, nisl sed posuere vehicula, enim libero accumsan dui, eget pulvinar diam nulla sed ligula. Fusce fringilla iaculis interdum. Mauris vitae posuere ante, non sollicitudin lectus. Quisque mollis ligula placerat semper tristique. Aliquam viverra feugiat diam, vel placerat tortor. Curabitur at lectus ac mauris varius pretium eget sagittis libero. Vivamus ultrices leo massa. Aenean vehicula ipsum eu gravida tempor. Proin pharetra, justo sit amet dictum hendrerit, elit ex pellentesque ipsum, ut accumsan elit nunc sit amet augue.

Aenean in sodales neque, nec imperdiet mi. Nam purus purus, accumsan quis dictum ac, interdum et est. Vivamus pulvinar est placerat tempus rhoncus. In sollicitudin, quam vestibulum vestibulum tempus, mauris lorem ultricies turpis, non gravida ex elit quis lectus. Integer ac tristique nisl. Suspendisse ac maximus urna. Etiam consequat eu dui eu scelerisque. Fusce blandit sagittis leo. Sed accumsan leo id odio auctor consectetur ut sed leo. Aenean aliquam tempor diam, eget mattis neque convallis non. Integer tincidunt mattis neque et condimentum.

Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi id ultricies erat, ac mollis nisi. Etiam vestibulum consectetur sodales. Suspendisse tempor lobortis enim, volutpat aliquet turpis iaculis id. Nam et fringilla erat, eu pulvinar tellus. Morbi pretium ante non iaculis feugiat. Integer feugiat tellus finibus lectus feugiat consectetur. Nulla luctus, est quis rhoncus porttitor, felis urna molestie elit, id placerat elit nunc sed nisl. Integer quis dui elit. Praesent dolor turpis, sagittis ut orci sed, aliquam tristique libero. Morbi mollis sagittis leo, et dictum quam dapibus vel. Vivamus ornare mauris sit amet ligula consequat, id imperdiet enim vestibulum.

Aenean condimentum massa eu lectus imperdiet luctus. Maecenas scelerisque condimentum arcu, quis faucibus nisi vulputate non. Praesent egestas diam a nisl ullamcorper pharetra. Quisque viverra porttitor dui quis feugiat. Donec non luctus massa. Mauris sit amet eros id lorem consequat elementum tempus et tellus. Fusce quam ipsum, aliquam feugiat mi vel, dapibus scelerisque nisi. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nam feugiat convallis neque facilisis placerat. Fusce molestie nisl libero, id tempor felis gravida sit amet.
`;

const section2 = `
## Vivamus ac dictum mauris

Nam interdum magna eu pretium laoreet. Nam congue, justo vel fringilla luctus, sapien elit aliquam nunc, a bibendum est odio nec turpis. Nam id porttitor ex. Morbi sit amet felis vitae ex accumsan auctor eget quis sapien. Praesent id metus vitae diam sagittis suscipit ut in ex. Ut non venenatis quam, a pharetra lacus. Praesent venenatis volutpat nisl. Vivamus est erat, vehicula sed vestibulum non, vehicula blandit lorem. Nullam vehicula quis tortor ut pulvinar. Integer laoreet quam in risus pharetra, eu iaculis tortor volutpat. Sed sagittis mauris a congue commodo.

Pellentesque ac eros leo. Morbi et congue mauris, quis imperdiet velit. Vivamus congue velit in elit eleifend, ut molestie felis pellentesque. Pellentesque gravida ultrices odio, nec bibendum augue. Nunc sit amet mi elementum, venenatis lorem in, rutrum nunc. Quisque eget pharetra orci. Donec vel lorem in odio tempus gravida et et nibh. Proin nisl nibh, maximus eget dolor sit amet, luctus placerat justo.

Cras et tellus non turpis lobortis molestie in sollicitudin massa. Quisque at urna posuere, convallis felis sit amet, suscipit erat. Pellentesque at accumsan est, et dapibus diam. Nam volutpat consequat tortor, ac porttitor arcu consectetur vitae. Donec tempus, enim quis sodales pretium, sapien lacus sollicitudin libero, non sollicitudin tortor nulla in urna. Etiam venenatis tincidunt fermentum. Pellentesque sit amet turpis tincidunt, finibus enim eget, sollicitudin neque.

Vivamus in feugiat tellus, quis imperdiet ipsum. Duis vel libero quis metus sollicitudin feugiat. Aenean ipsum dui, lacinia sit amet volutpat sed, lobortis et nunc. Nulla convallis, arcu quis condimentum eleifend, sem nulla congue mauris, in congue neque justo vitae erat. Mauris facilisis purus eget justo tempus bibendum. Vivamus sed lacinia risus. Phasellus sit amet laoreet erat. Nulla egestas massa nec felis commodo finibus. Nulla consequat massa id ultrices efficitur. Sed maximus interdum auctor. Fusce a commodo orci. Sed dictum, tortor ac porttitor pharetra, arcu justo convallis turpis, vel tristique lacus tellus quis ligula.

Donec in nisl sollicitudin, luctus elit eget, viverra dolor. Aliquam eget odio id mauris rutrum blandit. Quisque vitae nunc sed risus varius dignissim. Quisque porttitor nibh ac ex facilisis posuere. Vivamus varius tempus ligula, at scelerisque mauris posuere nec. Aliquam in lorem sed leo mattis lacinia. Nullam sollicitudin rhoncus congue. Nam tristique vulputate leo et venenatis. Suspendisse et auctor ex. Quisque mattis mi at enim fermentum viverra. Sed mattis, ligula in molestie venenatis, nibh eros rhoncus purus, ut pharetra purus nunc sed metus.
`;

const section3 = `
## Nam tortor erat

Nam tortor erat, lacinia at cursus sit amet, dignissim id nibh. Nulla id nunc quis ante fringilla consequat sollicitudin non nisl. Cras tempus finibus mauris eget sodales. Donec congue sed erat sed efficitur. Donec vel leo erat. Sed commodo luctus turpis vel rutrum. Phasellus a tincidunt sem, a ullamcorper nibh. Nunc pharetra congue lacus eget maximus. Nullam venenatis sit amet nibh at consectetur. Mauris hendrerit leo lobortis feugiat ullamcorper. Sed mattis lectus at metus aliquam placerat. Donec malesuada lacus in arcu sagittis finibus. Proin blandit mi non libero vulputate tristique. Praesent quis tortor tempus, feugiat enim ac, porttitor libero. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;

Nunc gravida eleifend ante sed sagittis. Sed id turpis nibh. Donec id dui non lorem laoreet lacinia eget sed tellus. Curabitur at dolor aliquam, rhoncus elit eget, auctor leo. Duis ut justo facilisis, ultrices erat convallis, semper erat. Sed ac risus facilisis, vestibulum nunc ac, fringilla magna. Aenean eget nulla ac purus laoreet dictum quis a tortor. Donec ultricies varius ligula, ac ultrices odio ornare eu. Praesent venenatis viverra augue ut bibendum. Fusce commodo lectus a finibus euismod. Ut tempus mauris et dui feugiat hendrerit ac quis turpis. Aenean fringilla velit quis aliquam imperdiet. Suspendisse pellentesque tristique gravida. Nulla facilisi. Nunc laoreet, ex eu ullamcorper ullamcorper, libero lorem suscipit tellus, a hendrerit nunc dui sit amet lacus. Nam quis ante nisl.

Nulla vel dolor sed nisl ultricies lobortis. Donec mattis sem vitae ante sollicitudin maximus. Cras fringilla erat et nisi hendrerit, ut egestas tellus maximus. Proin vitae mauris in arcu rutrum ullamcorper. Nulla fringilla dapibus sapien vitae iaculis. Aliquam egestas sem sit amet urna ultrices, quis viverra massa tincidunt. Proin convallis congue risus vitae blandit. Suspendisse nec tellus nisl. Donec finibus augue volutpat ipsum suscipit sagittis.

Sed convallis et nunc et sagittis. Aenean sit amet ultricies enim. Nunc dapibus augue eu malesuada posuere. Vestibulum aliquet pharetra porttitor. Integer iaculis turpis eget urna efficitur vehicula. Quisque eu fermentum lorem, et viverra tortor. Vestibulum non leo ut libero lobortis elementum. Suspendisse vel sem tellus. Integer non magna ut dolor blandit ullamcorper eu eget leo.

Etiam cursus sem at dignissim facilisis. Morbi rhoncus porttitor tellus vitae ornare. Vivamus auctor eget mi et dictum. Ut accumsan interdum erat, eu lacinia turpis condimentum ullamcorper. Cras tempus vehicula pellentesque. Vivamus eleifend consequat enim eu venenatis. Integer ac magna vulputate, venenatis mauris id, laoreet justo. Pellentesque vestibulum convallis porta. Maecenas sit amet nisi dui. Integer scelerisque ullamcorper justo, vel bibendum nulla tempor a. Aenean pellentesque varius neque, vel pellentesque augue rhoncus eget. Aenean vestibulum eleifend tellus, sit amet interdum magna volutpat hendrerit.
`;

const section4 = `
## Vestibulum ante ipsum primis in faucibus orci luctus

Aliquam id mattis lacus. Aenean elementum urna in lobortis aliquet. Vivamus ac dictum mauris, at ullamcorper massa. Nam eleifend ligula a nibh tempor, eget tristique est pretium. Quisque a vestibulum tortor, sit amet ullamcorper erat. Pellentesque at ligula consectetur, pharetra neque in, molestie velit. Vivamus nisi elit, iaculis vitae urna vel, iaculis volutpat risus. Aliquam in velit imperdiet, volutpat arcu in, dignissim velit. Suspendisse sodales mauris ut justo faucibus elementum. Vestibulum ante mi, luctus ut pharetra ac, lobortis in tortor. Aliquam suscipit ipsum lacus, in luctus nisl lobortis vitae. Duis quis ante purus. Morbi ullamcorper mattis diam. Suspendisse suscipit justo risus, nec semper risus convallis ultrices. In sodales lobortis pulvinar. Aliquam volutpat ultrices tellus non rutrum.

Fusce bibendum mattis nunc non faucibus. Suspendisse vehicula ornare scelerisque. Fusce vel purus eget massa viverra consectetur. Quisque nulla mi, molestie et hendrerit vitae, eleifend quis lorem. Maecenas leo eros, ornare tempor feugiat ac, aliquam sit amet nisl. Maecenas turpis tortor, fermentum at scelerisque tristique, rutrum non tellus. Quisque eu consectetur nibh, id porttitor nulla. Etiam nec justo mauris. Fusce sit amet eros dui.

Morbi sodales imperdiet blandit. Nunc ac tincidunt tellus. Pellentesque facilisis ornare dui non iaculis. Pellentesque ut pulvinar nulla. Morbi ex erat, aliquam et rhoncus ac, interdum vitae odio. Integer consequat quam et augue blandit, eget mollis dolor aliquet. Donec dapibus velit molestie eros sagittis sagittis. Quisque molestie lacus nec nulla mattis, sed porttitor lacus tincidunt.

Nulla eu vehicula arcu, non suscipit enim. Mauris nec eros pharetra, dapibus magna at, dictum dolor. Praesent elementum justo felis, eu aliquet ex bibendum sed. Maecenas aliquet venenatis sapien quis facilisis. In ullamcorper, augue non convallis mollis, velit ex efficitur nulla, eget aliquam orci magna id odio. Donec maximus quis turpis et cursus. Nam sit amet odio mi.

Proin tristique, dolor vitae imperdiet rhoncus, dolor metus vehicula eros, id suscipit mi quam non nisl. Morbi tempor, arcu id suscipit porttitor, massa lacus dapibus turpis, id porta metus urna ut leo. Curabitur mattis auctor elit. Aenean malesuada placerat massa at vehicula. Quisque vestibulum tincidunt orci maximus malesuada. Pellentesque vitae arcu ante. Morbi eu venenatis lectus, eu lobortis risus. Cras maximus est vel justo iaculis vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Suspendisse sed odio est. Sed dignissim, sapien eu elementum finibus, velit ante laoreet ipsum, fringilla eleifend magna mauris quis eros.
`;

const section5 = `
## Cras vel nunc felis

In hac habitasse platea dictumst. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nam nunc felis, finibus eget nisi ac, tincidunt congue justo. Aliquam consectetur erat ac elementum pretium. Etiam tristique malesuada magna, eget bibendum nunc cursus sed. Ut sodales arcu at metus varius, at elementum neque convallis. Ut tristique imperdiet massa, ut tempus quam placerat ut. Suspendisse in felis lobortis, imperdiet odio ac, gravida nulla.

Fusce velit lectus, tincidunt ac ullamcorper non, lacinia ut ex. Donec in nibh cursus, hendrerit ipsum in, dictum libero. Ut ut neque nisl. Nunc quis turpis convallis, consectetur nunc ac, faucibus risus. Aenean condimentum euismod ante id pretium. Ut non dui vitae augue vehicula dapibus. Vestibulum semper lacinia libero, eget tempor dui fringilla vel. Proin sagittis tellus id magna tincidunt mollis.

Vivamus et mattis eros. Suspendisse potenti. Proin eu est a orci scelerisque molestie. Suspendisse blandit ac risus eget viverra. Duis rhoncus facilisis est, a egestas nulla tempus eget. Morbi accumsan ex vel diam feugiat gravida. In id felis lorem. Donec eu consequat dolor. Mauris interdum, velit vel mollis hendrerit, urna ante commodo nibh, quis dapibus lacus lacus sit amet purus. Vestibulum ipsum orci, vulputate cursus maximus lobortis, pharetra in est. Mauris ullamcorper diam sit amet pretium tincidunt.

Sed sed velit lectus. Quisque nec bibendum leo. Nam a purus nec dui vulputate luctus eget et diam. Praesent ut sagittis ligula, vitae volutpat dui. Nulla facilisi. Etiam tincidunt dui ac fringilla ornare. Praesent suscipit nibh sed mi tempus, mollis fringilla dolor imperdiet. Integer ac viverra lorem, vitae sagittis sem. Phasellus luctus nibh dictum efficitur sodales. Nulla euismod in nisi quis eleifend. Donec ipsum turpis, cursus nec venenatis sed, ornare id est. In vitae libero eget orci accumsan rutrum vehicula nec sem. Maecenas vel ultrices nunc.

Curabitur consequat nisi velit, sit amet finibus nibh commodo nec. Cras vel nunc felis. Praesent eleifend nisi elit, vitae pharetra urna ornare sit amet. Vestibulum fringilla vulputate facilisis. In sem lectus, placerat nec semper eget, congue in est. Integer a tristique augue. Curabitur ut nibh id mi suscipit volutpat ut sit amet magna. Nullam malesuada laoreet porttitor. Fusce non felis ut nisi elementum auctor. Duis maximus nisi nec dolor fermentum condimentum. Suspendisse id ex velit. Sed eleifend aliquam vestibulum. Nulla a ornare nunc, nec tempus tellus.
`;

module.exports = async function initDb() {

  const container = await bootstrapper.createContainer();

  const db = container.get(Database);
  const documentService = container.get(DocumentService);

  const documentId = uniqueId.create();
  const title = 'Lorem Ipsum';
  const sections = [
    {
      _id: uniqueId.create(),
      order: 1,
      type: 'markdown',
      content: {
        de:
        section1
      }
    },
    {
      _id: uniqueId.create(),
      order: 1,
      type: 'markdown',
      content: {
        de:
        section2
      }
    },
    {
      _id: uniqueId.create(),
      order: 1,
      type: 'markdown',
      content: {
        de:
        section3
      }
    },
    {
      _id: uniqueId.create(),
      order: 1,
      type: 'markdown',
      content: {
        de:
        section4
      }
    },
    {
      _id: uniqueId.create(),
      order: 1,
      type: 'markdown',
      content: {
        de:
        section5
      }
    }
  ];
  const user = {
    name: 'init-user'
  };

  await documentService.createDocumentRevision({ documentId, title, sections, user });

  await db.dispose();
};
