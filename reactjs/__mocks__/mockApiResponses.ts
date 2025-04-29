// mockApiResponses.ts
// Mock responses for iTunes API calls
// These can be used for testing purposes by candidates

export const mockArtistsResponse = {
  resultCount: 3,
  results: [
    {
      wrapperType: "artist",
      artistType: "Artist",
      artistName: "Coldplay",
      artistLinkUrl: "https://music.apple.com/us/artist/coldplay/471744",
      artistId: 471744,
      amgArtistId: 435023,
      primaryGenreName: "Alternative",
      primaryGenreId: 20,
    },
    {
      wrapperType: "artist",
      artistType: "Artist",
      artistName: "Coldplay Tribute Band",
      artistLinkUrl:
        "https://music.apple.com/us/artist/coldplay-tribute-band/582483094",
      artistId: 582483094,
      primaryGenreName: "Pop",
      primaryGenreId: 14,
    },
    {
      wrapperType: "artist",
      artistType: "Artist",
      artistName: "Coldplay Piano Tribute",
      artistLinkUrl:
        "https://music.apple.com/us/artist/coldplay-piano-tribute/961646487",
      artistId: 961646487,
      primaryGenreName: "Classical",
      primaryGenreId: 5,
    },
  ],
};

export const mockAlbumsResponse = {
  resultCount: 4,
  results: [
    {
      wrapperType: "artist",
      artistType: "Artist",
      artistName: "Coldplay",
      artistLinkUrl: "https://music.apple.com/us/artist/coldplay/471744",
      artistId: 471744,
      amgArtistId: 435023,
      primaryGenreName: "Alternative",
      primaryGenreId: 20,
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 471744,
      collectionId: 1440731628,
      amgArtistId: 435023,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      collectionCensoredName: "Parachutes",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/parachutes/1440731628?uo=4",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright: "℗ 2000 Parlophone Records Ltd, a Warner Music Group Company",
      country: "USA",
      currency: "USD",
      releaseDate: "2000-07-10T07:00:00Z",
      primaryGenreName: "Alternative",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 471744,
      collectionId: 1440765241,
      amgArtistId: 435023,
      artistName: "Coldplay",
      collectionName: "A Rush of Blood to the Head",
      collectionCensoredName: "A Rush of Blood to the Head",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/a-rush-of-blood-to-the-head/1440765241?uo=4",
      artworkUrl60:
        "https://is5-ssl.mzstatic.com/image/thumb/Music128/v4/7f/28/30/7f283003-d8ef-e8fd-e6e9-95b7bbb63a3f/source/60x60bb.jpg",
      artworkUrl100:
        "https://is5-ssl.mzstatic.com/image/thumb/Music128/v4/7f/28/30/7f283003-d8ef-e8fd-e6e9-95b7bbb63a3f/source/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 11,
      copyright: "℗ 2002 Parlophone Records Ltd, a Warner Music Group Company",
      country: "USA",
      currency: "USD",
      releaseDate: "2002-08-08T07:00:00Z",
      primaryGenreName: "Alternative",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 471744,
      collectionId: 1440833823,
      amgArtistId: 435023,
      artistName: "Coldplay",
      collectionName: "X&Y",
      collectionCensoredName: "X&Y",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl: "https://music.apple.com/us/album/x-y/1440833823?uo=4",
      artworkUrl60:
        "https://is4-ssl.mzstatic.com/image/thumb/Music118/v4/ad/40/4c/ad404c5e-05cf-aecb-e53e-432a0c4c47fe/source/60x60bb.jpg",
      artworkUrl100:
        "https://is4-ssl.mzstatic.com/image/thumb/Music118/v4/ad/40/4c/ad404c5e-05cf-aecb-e53e-432a0c4c47fe/source/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 13,
      copyright: "℗ 2005 Parlophone Records Ltd, a Warner Music Group Company",
      country: "USA",
      currency: "USD",
      releaseDate: "2005-06-06T07:00:00Z",
      primaryGenreName: "Alternative",
    },
  ],
};

export const mockSongsResponse = {
  resultCount: 11,
  results: [
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 471744,
      collectionId: 1440731628,
      amgArtistId: 435023,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      collectionCensoredName: "Parachutes",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/parachutes/1440731628?uo=4",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      collectionExplicitness: "notExplicit",
      trackCount: 10,
      copyright: "℗ 2000 Parlophone Records Ltd, a Warner Music Group Company",
      country: "USA",
      currency: "USD",
      releaseDate: "2000-07-10T07:00:00Z",
      primaryGenreName: "Alternative",
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731854,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Don't Panic",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Don't Panic",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/dont-panic/1440731628?i=1440731854&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/dont-panic/1440731628?i=1440731854&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/20/c9/5f/20c95f76-24b9-90a8-f3a8-8964e5e4e2b0/mzaf_4357949474613237279.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 1,
      trackTimeMillis: 137973,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731855,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Shiver",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Shiver",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/shiver/1440731628?i=1440731855&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/shiver/1440731628?i=1440731855&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/c4/95/ea/c495eadb-b6d6-ff16-70ee-cb1c721d862f/mzaf_1870731456655459061.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-03-06T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 2,
      trackTimeMillis: 302160,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731857,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Spies",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Spies",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/spies/1440731628?i=1440731857&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/spies/1440731628?i=1440731857&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/14/fd/be/14fdbe31-386d-e8f0-98e4-ffef6ab539ad/mzaf_5231921405221546275.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 3,
      trackTimeMillis: 319240,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731859,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Sparks",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Sparks",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/sparks/1440731628?i=1440731859&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/sparks/1440731628?i=1440731859&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/fa/1b/a1/fa1ba171-3b60-daeb-a905-d2567dbf23f0/mzaf_5586565227377748362.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 4,
      trackTimeMillis: 227240,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731860,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Yellow",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Yellow",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/yellow/1440731628?i=1440731860&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/yellow/1440731628?i=1440731860&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/db/d7/45/dbd745fa-0474-a2f3-4d83-9bf4a1e5e002/mzaf_1342145253925807736.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-06-26T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 5,
      trackTimeMillis: 267773,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731861,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Trouble",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Trouble",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/trouble/1440731628?i=1440731861&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/trouble/1440731628?i=1440731861&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/71/e2/cd/71e2cd4d-3136-74f6-5fb8-87fe212fa02f/mzaf_4695732142220145339.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-10-23T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 6,
      trackTimeMillis: 273373,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731863,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Parachutes",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Parachutes",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/parachutes/1440731628?i=1440731863&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/parachutes/1440731628?i=1440731863&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/a9/f6/b4/a9f6b4e1-f55a-8c91-a0a4-67349f426212/mzaf_6284669543583839101.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 7,
      trackTimeMillis: 46440,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731864,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "High Speed",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "High Speed",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/high-speed/1440731628?i=1440731864&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/high-speed/1440731628?i=1440731864&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview128/v4/7d/34/99/7d34991c-6f95-c1cb-7d28-8672d0e49271/mzaf_5285372276308119515.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 8,
      trackTimeMillis: 256400,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731865,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "We Never Change",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "We Never Change",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/we-never-change/1440731628?i=1440731865&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/we-never-change/1440731628?i=1440731865&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/78/52/24/7852249d-06ca-5811-9e9a-9a7b3d19e9fd/mzaf_4358523929071266395.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 9,
      trackTimeMillis: 249773,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
    {
      wrapperType: "track",
      kind: "song",
      artistId: 471744,
      collectionId: 1440731628,
      trackId: 1440731866,
      artistName: "Coldplay",
      collectionName: "Parachutes",
      trackName: "Everything's Not Lost",
      collectionCensoredName: "Parachutes",
      trackCensoredName: "Everything's Not Lost",
      artistViewUrl: "https://music.apple.com/us/artist/coldplay/471744?uo=4",
      collectionViewUrl:
        "https://music.apple.com/us/album/everythings-not-lost/1440731628?i=1440731866&uo=4",
      trackViewUrl:
        "https://music.apple.com/us/album/everythings-not-lost/1440731628?i=1440731866&uo=4",
      previewUrl:
        "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview118/v4/33/51/6c/33516cdf-f6e9-cfa4-a4a3-92f7b527a1e7/mzaf_8274244519550872936.plus.aac.p.m4a",
      artworkUrl30:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/30x30bb.jpg",
      artworkUrl60:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/60x60bb.jpg",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      collectionPrice: 9.99,
      trackPrice: 1.29,
      releaseDate: "2000-07-10T12:00:00Z",
      collectionExplicitness: "notExplicit",
      trackExplicitness: "notExplicit",
      discCount: 1,
      discNumber: 1,
      trackCount: 10,
      trackNumber: 10,
      trackTimeMillis: 447693,
      country: "USA",
      currency: "USD",
      primaryGenreName: "Alternative",
      isStreamable: true,
    },
  ],
};

export const mockEmptyResponse = {
  resultCount: 0,
  results: [],
};

export const mockErrorResponse = {
  errorMessage: "Invalid request parameters",
  status: 400,
};

// This mock combines multiple albums with their songs in a single response
// Useful for testing the composite getArtistAlbumsByName function
export const mockArtistWithAlbumsAndSongs = {
  artistName: "Coldplay",
  artistId: 471744,
  albums: [
    {
      collectionId: 1440731628,
      collectionName: "Parachutes",
      artworkUrl100:
        "https://is3-ssl.mzstatic.com/image/thumb/Music118/v4/c1/53/e3/c153e33b-7ea9-14c0-40d1-721f22ea1f55/source/100x100bb.jpg",
      artistName: "Coldplay",
      songs: [
        { trackId: 1440731854, trackName: "Don't Panic", trackNumber: 1 },
        { trackId: 1440731855, trackName: "Shiver", trackNumber: 2 },
        { trackId: 1440731857, trackName: "Spies", trackNumber: 3 },
        { trackId: 1440731859, trackName: "Sparks", trackNumber: 4 },
        { trackId: 1440731860, trackName: "Yellow", trackNumber: 5 },
        { trackId: 1440731861, trackName: "Trouble", trackNumber: 6 },
        { trackId: 1440731863, trackName: "Parachutes", trackNumber: 7 },
        { trackId: 1440731864, trackName: "High Speed", trackNumber: 8 },
        { trackId: 1440731865, trackName: "We Never Change", trackNumber: 9 },
        {
          trackId: 1440731866,
          trackName: "Everything's Not Lost",
          trackNumber: 10,
        },
      ],
    },
    {
      collectionId: 1440765241,
      collectionName: "A Rush of Blood to the Head",
      artworkUrl100:
        "https://is5-ssl.mzstatic.com/image/thumb/Music128/v4/7f/28/30/7f283003-d8ef-e8fd-e6e9-95b7bbb63a3f/source/100x100bb.jpg",
      artistName: "Coldplay",
      songs: [
        { trackId: 1440765242, trackName: "Politik", trackNumber: 1 },
        { trackId: 1440765243, trackName: "In My Place", trackNumber: 2 },
        {
          trackId: 1440765244,
          trackName: "God Put a Smile Upon Your Face",
          trackNumber: 3,
        },
        { trackId: 1440765245, trackName: "The Scientist", trackNumber: 4 },
        { trackId: 1440765246, trackName: "Clocks", trackNumber: 5 },
        { trackId: 1440765247, trackName: "Daylight", trackNumber: 6 },
        { trackId: 1440765248, trackName: "Green Eyes", trackNumber: 7 },
        { trackId: 1440765249, trackName: "Warning Sign", trackNumber: 8 },
        { trackId: 1440765250, trackName: "A Whisper", trackNumber: 9 },
        {
          trackId: 1440765251,
          trackName: "A Rush of Blood to the Head",
          trackNumber: 10,
        },
        { trackId: 1440765252, trackName: "Amsterdam", trackNumber: 11 },
      ],
    },
  ],
};

// Mock for testing debouncing and duplicate filtering
export const mockDuplicateAlbums = {
  resultCount: 4,
  results: [
    {
      wrapperType: "artist",
      artistType: "Artist",
      artistName: "The Beatles",
      artistLinkUrl: "https://music.apple.com/us/artist/the-beatles/136975",
      artistId: 136975,
      primaryGenreName: "Rock",
      primaryGenreId: 21,
    },
    // Same album appearing twice with same ID (this happens in real iTunes API)
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 136975,
      collectionId: 1441164359,
      artistName: "The Beatles",
      collectionName: "Abbey Road",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/0d/00/47/0d0047c3-e334-8180-740e-2071e642fb8a/source/100x100bb.jpg",
      releaseDate: "1969-09-26T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 136975,
      collectionId: 1441164359, // Same ID as above
      artistName: "The Beatles",
      collectionName: "Abbey Road",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/0d/00/47/0d0047c3-e334-8180-740e-2071e642fb8a/source/100x100bb.jpg",
      releaseDate: "1969-09-26T07:00:00Z",
      primaryGenreName: "Rock",
    },
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistId: 136975,
      collectionId: 1441133180,
      artistName: "The Beatles",
      collectionName: "Sgt. Pepper's Lonely Hearts Club Band",
      artworkUrl100:
        "https://is5-ssl.mzstatic.com/image/thumb/Music111/v4/6e/21/84/6e218487-b240-9b3c-b0cc-62d76b9831d6/source/100x100bb.jpg",
      releaseDate: "1967-05-26T07:00:00Z",
      primaryGenreName: "Rock",
    },
  ],
};
