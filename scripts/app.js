function query(ele){
    return document.querySelector(ele);
}

function queryAll(ele){
    return document.querySelectorAll(ele);
}

function hideScroll(visible, body){ 
    body.style.overflow = visible ? 'visible' : 'hidden';
}

function getIframeLink(iframe, keys){
    return iframe.src = `https://www.youtube.com/embed/${keys.results[0].key}?modestbranding=1&color=white`;
}

function removeIframe(trailer, iframe){
    trailer.classList.remove('modal-active');
    iframe.remove();
    hideScroll(true, query('body'));
}

function showModalTrailer(item, btnTrailer, type){
    const trailer = query('.modal-trailer')
        , iframe = document.createElement('iframe');

    btnTrailer.addEventListener('click', () => {
        trailer.firstElementChild.appendChild(iframe);
        trailer.classList.add('modal-active');
        hideScroll(false, query('body'));

        request(type, item.id, true, 3).then((link) => {
            if(!link.results.length){
                request(type, item.id, true, 3, false, false).then((linkUS) =>{
                    getIframeLink(iframe, linkUS);
                });
            }else{
                getIframeLink(iframe, link);
            }
        })
    })
    
    const close = trailer.lastElementChild;
    [trailer, close].map(clickIn => {
        clickIn.addEventListener('click', () => {
            removeIframe(trailer, iframe);
        })
    })
}

function getTrailerExplorer(addYearFuture){
    let dateNow = new Date()
    , dateFormated = Intl.DateTimeFormat().format(dateNow).split('/').reverse().join('-')
    , yearFuture = dateNow.getFullYear() + addYearFuture;
    const params = [
        '&sort_by=popularity.desc',
        '&include_adult=false&include_video=true&page=1',
        '&vote_count.gte=0&vote_count.lte=0',
        `&release_date.gte=${dateFormated}`,
        `&release_date.lte=${yearFuture}-07-01`
    ]
    return params.join('')
}

function createUrl(mode, id, trailer){
    const API = 'api_key=8575f881e26d32c0677395735bbe44b7'
        , options = [
            mode + '/', id, 
            trailer ? '/videos?' : '?',
            API, mode === 'discover' ? getTrailerExplorer(1) : '',
        ]
    return options.join('');
}

async function request(mode, id, trailer, version = 4, types, language ='pt-BR'){
    const url = [
        `https://api.themoviedb.org/${version}/`,
        createUrl(mode, id, trailer),
        version === 4 ? '&sort_by=popularity.desc' : '',
        '&language=' + (language || 'en-US'),
        types ? `&append_to_response=${types}` : ''
    ]
    const data = await fetch(url.join(''));
    if(data.ok){
        return data.json();
    }else{
        console.log('Error')
    }
}

function getAllLists(version){ 
    const ids = [7110926, 7110927, 7110930, 7110929];
    return ids.map(list => request('list', list, false, version))
}

function updateResponsive(values, getUpdate, status, arrows){
    let update;
    const screens = [769, 768, 480, 320]
        , createMQ = (screen, i) => window.matchMedia(`(${i === 0 ? 'min' : 'max'}-width:${screen}px)`);

    screens.map((screen, index) => {
        const mq = createMQ(screen, index);
        if(mq.matches){
            update = getUpdate(values, index, status, arrows, mq);
        }
    });

    return update;
}

function getImageSize(sizes, index){
    return (sizes[index] || sizes[index - 1])
}

function setImageUrl(item, size, mode = true){
    let width = 0;
    const link = 'https://image.tmdb.org/t/p/w'
        , backdrop = [1280, 780]
        , poster = [300, 154, 185, 154];
        
    width =  size || (mode ? updateResponsive(poster, getImageSize) : updateResponsive(backdrop, getImageSize));
    return `${link}${width}${mode ? item.poster_path : item.backdrop_path}`;
}

function getItemName(item){ 
    return (item.name || item.title);
}

function getOriginalName(item){
    return (item.original_title || item.original_name);
}

const search = query('.search', false)
, mainSearch = query('main', false)
, searchToggle = [search, mainSearch]
, setHide = 'search-hidden';

function searchBtnAction(){
    const searchBtns = query('.search-box-icon', false),
    btns = [...searchBtns.children];

    searchBtns.addEventListener('click', () => {
        searchToggle.map((nod, i) => nod.classList.toggle(!i ? setHide : 'search-opacity'));
        btns.map(btn => btn.classList.toggle(setHide));
        if(search.classList.contains(setHide)) resetSearch();
    })
}

searchBtnAction();

let datas, filtered;
function matchNames(item, value){
    const rex = new RegExp(value, 'gi');
    return (getItemName(item).match(rex) || getOriginalName(item).match(rex));
}

function addPreview(item, preview){
    if(preview.childElementCount < 10){
        const div  = document.createElement('div')
        , name = getItemName(item);

        div.innerHTML = `<img src="${setImageUrl(item, 92, true)}" alt="${name}"/><p>${name}</p>`;
        preview.appendChild(div);
    }
}

function getPreviews(value, preview, loading){
    const size = value.length
        , resetRes = () => preview.textContent = '';

    if(size > 1 && !datas){
        datas = Promise.all(getAllLists(3)).then(lists => {
            return lists[0].items.concat(lists[1].items, lists[2].items, lists[3].items);
        })
    }
    
    if(size < 2){
        resetRes();
    }else{
        datas.then(data => {
            filtered = data.filter(item => matchNames(item, value));
            if(filtered !== preview.childElementCount){
                resetRes();
                preview.classList.remove('search-box-hidden');
                filtered.map(item => addPreview(item, preview))
            }

            if(!filtered.length){
                preview.innerHTML = `<p>Nenhuma resultado para : <b>"${value}"</p>`;
            }

            loading.classList.add(setHide);
        })
    }


}

let timeInput = null;
const searchBox = query('.search', false)
, searchInput = query('.search-input', false)
, searchResults = searchBox.lastElementChild
, searchLoading = query('.box-loading', false);

function resetSearch(){
    searchInput.value = '';
    searchResults.textContent = '';
    searchResults.classList.add(setHide)
}

searchInput.addEventListener('input', (evt) =>{
    searchLoading.classList.remove(setHide);
    const value = evt.target.value.trim();
    if(value) searchResults.classList.remove(setHide);
    clearTimeout(timeInput);
    timeInput = setTimeout(() => {
        getPreviews(value, searchResults, searchLoading);
    }, 1000);
})

let runtime = 0
, index = 0;
const slideTime = 10000;

function resetTimeHero(i){
    index = i;
    clearInterval(runtime);
    runtime = setInterval(startIndex, slideTime);
}

const slides = queryAll('.hero-slide')
    , covers = queryAll('.covers li')
    , classSlide = ['show-slide', 'show-border'];

function showSlideFrame (index){
    slides[index].classList.add(classSlide[0]);
    covers[index].classList.add(classSlide[1]);
}

function hideSlideFrame (index){
    slides[index].classList.remove(classSlide[0]);
    covers[index].classList.remove(classSlide[1]);
}

function coverLoading(cover){
    cover.children[0].addEventListener('load', () => cover.classList.remove('cover-loading'))
}

covers.forEach(cover => coverLoading(cover))

function offSlide(page){
    for(let b = 0; b < 5; b++){
        if(b !== page){
            hideSlideFrame(b);
        }
    }
}

(function() {
    covers.forEach((cover, index) => {
        cover.addEventListener('click', () => {
            showSlideFrame(index);
            resetTimeHero(index);
            covers.forEach((cover, other) => {
                if(index !== other){
                    hideSlideFrame(other);
                }
            })
        })
    })
}())

function setRuntime(bol = true){
    return bol ? clearInterval(runtime) : runtime = setInterval(startIndex, slideTime);
}

function setTimeSlide (element) {
    const mouse = ['mouseover', 'mouseout'];
    element.forEach((item) => {
        mouse.forEach((mode, i) => item.addEventListener(mode, () => setRuntime(i === 0)))
    })
}

function startIndex() {
    index++;
    if(index > 4) index = 0;
    if(index === index){
        offSlide(index);
        showSlideFrame(index);
    }
}

if(query('.hero')){
    window.addEventListener('DOMContentLoaded', function startHeroSlide() {
        showSlideFrame(0);
        runtime = setInterval(startIndex, slideTime);
        [queryAll('.btn-trailer'), queryAll('.btn-download')].map(elem => setTimeSlide(elem));
    })
}

!function menuMobile (){
    const hamMenu = query('.menu-mobile');
    hamMenu.onclick = () => {
        const menuMain = query('.menu');
        menuMain.classList.toggle('menu-open');
        query('body').classList.toggle('ofh');
        queryAll('.menu-mobile hr').forEach((linha, i) =>{
            linha.classList.toggle(`m${i + 1}-open`);
        })
    }
}()

const btnTrailer = queryAll('.btn-trailer')
, bannerH2 = queryAll('.hero-title')
, backDrop = queryAll('.bg-image')
, overViewNode = queryAll('.movie-overview')
, coverImg = queryAll('.covers img');

let iHero = 0;
function reduceText(item){
    let overview = item.overview.split(' ')
    .filter((word, index) => index < 31);

    if(!overview[overview.length - 1].includes('.')){
        overview.push('...');
    }
    return overview;
}

// ADICIONA O CONTEÚDOS AO BANNER PRINCIPAL
function heroMain(list, section){
    const sortList = list.sort((itemA, itemB) => itemA.popularity - itemB.popularity),
    sliceList = sortList.slice(!section ? -3 : -2);
    
    sliceList.map((item) => {
        bannerH2[iHero].textContent = getItemName(item);
        backDrop[iHero].setAttribute('src', setImageUrl(item, undefined, false));
        backDrop[iHero].setAttribute('alt', getItemName(item) + ' - Papel de fundo');

        overViewNode[iHero].textContent = reduceText(item).join(' ');

        coverImg[iHero].setAttribute('src', setImageUrl(item, 92));
        coverImg[iHero].setAttribute('alt', getItemName(item) + '- mini capa no canto inferior direito'); 
        showModalTrailer(item, btnTrailer[iHero], item.media_type);
        iHero++;
    })
}

// CREATE CARROSEL
const createEle  = (ele) => document.createElement(ele),
insertEle = (father, child) => father.appendChild(child);

function appendFragment(frag, elems){
    elems.map((ele) => frag.append(ele))
}

function createListNodes(elems){
    return elems.map(str => createEle(str));
}

function setMoveSection (rowMove, rowStatus, direct = true){
    const pass = 50;
    rowMove.style.transform = `translateX(-${direct ? rowStatus.state -= pass : rowStatus.state += pass}%)`;
}

function setBaseContent(elements, item, size, isPoster = true){
    const width = size;
    elements[0].setAttribute('src', setImageUrl(item, width, isPoster));
    elements[0].setAttribute('alt', getItemName(item));
    elements[1].textContent = getItemName(item);
}

function showArrow(arrow, show = true) {
    arrow.style.visibility = show ? 'visible' : 'hidden';
}

// SISTEMAS DE CLIQUES DAS SETAS
function clickArrows(arrows, index, status){
    if(index === 0){
        showArrow(arrows[1]);
        if(status.state < 100) showArrow(arrows[index], false);
        setMoveSection(status.row, status);
    }else{
        showArrow(arrows[0]);
        const limit = Math.ceil(status.row.childElementCount * status.size) - status.limit;
        if(status.state >= limit) showArrow(arrows[index], false);
        setMoveSection(status.row, status, false);
    }
}

function getRowReponsive(screenInfo, index, rowState, arrows, mq){
    rowState.size = screenInfo[index];
    mq.addEventListener('change', () => {
        rowState.size = screenInfo[index];
        arrows.forEach((arrow, i) => showArrow(arrow, i !== 0));
        rowState.row.style.transform = 'translateX(0%)';
        rowState.state = 0;
    })
}

function makeCardsMain(row, elements, item){
    const eleLi =  createEle('li')
        , listNode = createListNodes(elements)
        , card = new DocumentFragment();

    setBaseContent(listNode, item, null);
    const dateRelese = item.release_date || item.first_air_date;
    listNode[2].textContent = item.vote_average;
    listNode[3].textContent = dateRelese.slice(0, 4);

    appendFragment(card, listNode);
    eleLi.appendChild(card);
    insertEle(row, eleLi);

    const classes = ['img-act', 'h3-act', '', 'year-act'];
    addHoverItems(classes, eleLi);
}

function addMoveSections(status){
    const getChilds = status.row.parentElement.children[0].children,
    arrayArrow = [getChilds[0], getChilds[1]], 
    scrData = [16.666, 25, 50, 50];
    addArrowsMove(arrayArrow, scrData, status);
}

const rowConfigs = (row, id, state = 0, size, limit = 150) => ({id, row, state, size, limit})

// CRIA A MOVIMENTACÕES DAS COLUNAS E VISIBILIDADE DAS SETAS
function addArrowsMove(arrows, screenData, rowData){
    showArrow(arrows[0], false);
    arrows.forEach((arrow, index) => { 
        arrow.addEventListener('click', () => {
            updateResponsive(screenData, getRowReponsive, rowData, arrows);
            clickArrows(arrows, index, rowData);
        })
    })
}

// MOVIMENTAS TODOS OS CARTÕES DOS ITENS
function addHoverItems (actives, child){
    const mouseAct = ['mouseover', 'mouseout'];
    mouseAct.map((mouse, index) => {
        child.addEventListener(mouse, () => {
            actives.map((classe, ic) => {
                if(ic !== 2){
                    const itemNode = child.children[ic];
                    !index ? itemNode.classList.add(classe) : itemNode.classList.remove(classe)
                }
            })
        });
    });
}
// FINAL

// SISTEMA DE TRAILERS 
if(query('.hero')){
    (function (){
        const arrowsTrailer = queryAll('.trailer-arrows svg')
            , trailerItems = queryAll('.trailer-row li')
            , activeItems = ['imgActive'];
        request('discover', 'movie', false, 3).then(content => {
            const items = content.results;
            items.filter(movie => movie.backdrop_path).map((movie, index) => {
                if(index < 10){
                    const childs = trailerItems[index];
                    setBaseContent(childs.children, movie, 300, false);
                    showModalTrailer(movie, childs, 'movie');
                    addHoverItems(activeItems, childs);
                }
            });
        })

        const trlScreenData = [25, 50, 50, 100];

        addArrowsMove(arrowsTrailer, trlScreenData, rowConfigs(trailerItems[0].parentElement))
    })()

}

// MODELO PARA TODOS CARTÕES DOS ITENS
const rowsState = []
    , rows = queryAll('.row')
    , cardNode = ['img', 'h3', 'p', 'p'];

// EXECUTA TODAS AS LIGACÕES DA API
if(query('.hero')){
    Promise.all(getAllLists()).then(lists => {
        lists.map((list, section) => {
            const results = list.results;
            rowsState.push(rowConfigs(rows[section], section));
            if(section === 0 || section === 1) heroMain(results, section);
            results.map(item => makeCardsMain(rowsState[section].row, cardNode, item))
            addMoveSections(rowsState[section]);
            
        })
    });
}

if(query('body', false).classList.contains('post')){
    function setBannerImage(item){
        const bannerImage = query('.post-banner img', false);
        bannerImage.setAttribute('src', setImageUrl(item, null, false));
        bannerImage.setAttribute('alt', 'capa do ' + getItemName(item));
    }
    
    function calcRuntime(runtime){
        const hour = Math.trunc(runtime / 60)
            , minutes = runtime % 60;
    
        return `${hour ? hour + 'h ' : ''}${minutes} min.`;
    }
    
    function getDateRelease(date){
        return (date.release_date || date.first_air_date)
    }
    
    function getRating(certific){
        let brRating;
        certific.results.map(nation =>{
            if(nation.iso_3166_1 === 'BR'){
                brRating = nation.rating || nation.release_dates[0].certification;
            }
        })
    
        return brRating;
    }
    
    function setColorCert(certi, div) {
        const tracks = ['L', 10, 12, 14, 16, 18];
        tracks.map((track, index) => {
            if(certi == track){
                div.classList.add('track-' + index);
            }
        })
    }
    
    function getCertification(item, detail) {
        const certification = (item.release_dates || item.content_ratings)
        const rating = getRating(certification);
        detail.innerHTML = rating || '';
        setColorCert(rating, detail);
    }
    
    function getDetails(ul, item){
        ul.forEach(async (li, index) => {
            const detail = li.firstElementChild;
            switch (index) {
                case 0:
                    detail.innerHTML = item.vote_average;
                    break;
                case 1:
                    getCertification(item, detail);
                    break;
                case 2:
                    detail.innerHTML = (item.runtime || item.episode_run_time[0]) + ' min';
                    break;
                case 3:
                    detail.innerHTML = getDateRelease(item).slice(0, 4);
                    break;
                default:
                    detail.innerHTML = 'Indisponível';
                break;
            }
        });
    }
    
    function getMetas(ul, metas){
        metas.map(meta => {
            const li = document.createElement('li');
            li.textContent = meta.name;
            ul.appendChild(li);
        })
    }
    
    function reduceOverview(overview){
        return overview.split(' ')
            .filter((word, index) => index < 35)
            .join(' ')
    }
    
    function setHeader(item, type){
        const headerItem = query('.header-item')
            , details = queryAll('.info-details li')
            , metas = query('.info-tags');
        headerItem.children[0].setAttribute('src', setImageUrl(item, null))
        query('.info-title').innerText = getItemName(item);
        query('.info-overview').innerText = reduceOverview(item.overview) + '...';
        getDetails(details, item, type);
        getMetas(metas, item.genres);
    }

    (function(){
        const keys = [7110927, 7110930, 7110929]
            , key = () =>  keys[Math.floor(Math.random() * keys.length)]
        request('list', key()).then((list) => {
            const random = Math.floor(Math.random() * 18)
                , item = list.results[random]
                , append = 'release_dates,content_ratings'
            request(item.media_type, item.id, false, 3, append).then((content) => {
                setBannerImage(content);
                setHeader(content);
                showModalTrailer(content, query('.trailer-top'), item.media_type);
            })
        })
    })()
}