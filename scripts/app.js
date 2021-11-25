const API = {
    API_URL: 'https://api.themoviedb.org/',
    API_KEY: 'api_key=8575f881e26d32c0677395735bbe44b7',
    LANGUAGE: '&language=',
    IMG_URL: 'https://image.tmdb.org/t/p/w',
    LIST_IDS: [7110926, 7110927, 7110930, 7110929]
}

Object.freeze(API);

function getTrailerExplorer(addYearFuture){
    const startParams = '&sort_by=popularity.desc&include_adult=false&include_video=false&page=1'
    , endParams = '&vote_count.gte=0&vote_count.lte=0&vote_average.gte=0&vote_average.lte=0';
    let dateNow = new Date()
    , dateFormated = Intl.DateTimeFormat().format(dateNow).split('/').reverse().join('-')
    , yearFuture = dateNow.getFullYear() + addYearFuture
    , varParams = `&release_date.gte=${dateFormated}&release_date.lte=${yearFuture}-01-01`;
        
    return startParams + varParams + endParams;
}

function createUrl(mode, id, trailer, language){
    const options = trailer ? '/videos' : ''
    , extra = mode === 'discover' ? getTrailerExplorer(1) : '';
    if (!language) language = 'en-US';
    return `${mode}/${id}${options}?${API.API_KEY + API.LANGUAGE + language + extra}`;
}

async function request(mode, id, trailer, version = 4, language ='pt-BR'){
    const addOptions = createUrl(mode, id, trailer, language)
    , sortList = version === 4 ? '&sort_by=popularity.desc' : ''
    , url = await fetch(`${API.API_URL}${version}/${addOptions}${sortList}`);

    return url.ok ? url.json() : console.log('Error');
}

function query(item, all = true){ 
    return all ? document.querySelectorAll(item) : document.querySelector(item);
}

function blockBody(visible){ 
    query('body', false).style.overflow = visible ? 'visible' : 'hidden';
}

function getAllLists(version){ 
    return API.LIST_IDS.map(list => request('list', list, false, version))
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
    const backdrop = [1280, 780]
    , poster = [300, 154, 185, 154];
        
    width =  size || (mode ? updateResponsive(poster, getImageSize) : updateResponsive(backdrop, getImageSize));
    return `${API.IMG_URL}${width}${mode ? item.poster_path : item.backdrop_path}`;
}

function getItemName(item){ 
    return (item.name || item.title);
}

function getOriginalName(item){
    return (item.original_title || item.original_name);
}

function toggleClass(bool, elem, setClass){ 
    bool ? elem.classList.add(setClass) : elem.classList.remove(setClass);
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

function setSrcIframe(iframe, keys){
    return iframe.src = `https://www.youtube.com/embed/${keys.results[0].key}?modestbranding=1&color=white`;
}

function resetIframe(trailer, iframe){
    resetTimeHero(2);
    trailer.classList.remove('modal-active');
    iframe.remove();
    blockBody(true);
}

function showModalTrailer(item, btnTrailer){
    const trailer = query('.modal-trailer', false),
    iframe = document.createElement('iframe');
    trailer.addEventListener('mouseover', setRuntime);

    btnTrailer.addEventListener('click', () => {
        const mediaType = item.media_type || 'movie';
        trailer.firstElementChild.appendChild(iframe);
        trailer.classList.add('modal-active');
        blockBody(false);

        request(mediaType, item.id, true, 3).then((link) => {
            if(!link.results.length){
                request(mediaType, item.id, true, 3, false).then((linkUS) =>{
                    setSrcIframe(iframe, linkUS);
                });
            }else{
                setSrcIframe(iframe, link);
            }
        })
    })

    const loading = trailer.children[0].firstElementChild
        , hideLoading = () => loading.classList.add('trailer-loading-hidden');
    iframe.addEventListener('load', hideLoading);

    trailer.addEventListener('click', (evt) =>{
        evt.bubbles = false;
        resetIframe(trailer, iframe);
    });

    const close = trailer.lastElementChild;
    close.addEventListener('click', () => resetIframe(trailer, iframe));
}

const slides = query('.hero-slide')
    , covers = query('.covers li')
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

window.addEventListener('DOMContentLoaded', function startHeroSlide() {
    showSlideFrame(0);
    runtime = setInterval(startIndex, slideTime);
    [query('.btn-trailer'), query('.btn-download')].map(elem => setTimeSlide(elem));
})

!function menuMobile (){
    const hamMenu = query('.menu-mobile', false);
    hamMenu.onclick = () => {
        const menuMain = query('.menu', false);
        menuMain.classList.toggle('menu-open');
        query('body', false).classList.toggle('ofh');
        query('.menu-mobile hr').forEach((linha, i) =>{
            linha.classList.toggle(`m${i + 1}-open`);
        })
    }
}()

const btnTrailer = query('.btn-trailer')
, bannerH2 = query('.hero-title')
, backDrop = query('.bg-image')
, overViewNode = query('.movie-overview')
, coverImg = query('.covers img');

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
    sliceList = sortList.slice(section === 0 ? -3 : -2);
    
    sliceList.map((item) =>{
        bannerH2[iHero].textContent = getItemName(item);
        backDrop[iHero].setAttribute('src', setImageUrl(item, undefined, false));
        backDrop[iHero].setAttribute('alt', getItemName(item) + ' - Papel de fundo');

        overViewNode[iHero].textContent = reduceText(item).join(' ');

        coverImg[iHero].setAttribute('src', setImageUrl(item, 92));
        coverImg[iHero].setAttribute('alt', getItemName(item) + '- mini capa no canto inferior direito'); 
    
        showModalTrailer(item, btnTrailer[iHero]);
        iHero++;
    })
}

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

// CRIA OS ELEMENTOS E ADICIONA OS CONTEÚDOS NAS COLUNAS
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

// SISTEMA DE TRAILERS 
(function rowTrailer(){
    const arrowsTrailer = query('.trailer-arrows svg')
    , trailerItems = query('.trailer-row li')
    , activeItems = ['imgActive'];

    request('discover', 'movie', false, 3).then(content => {
        const items = content.results;
        items.filter(movie => movie.backdrop_path).map((movie, index) => {
            if(index < 10){
                const childs = trailerItems[index];
                setBaseContent(childs.children, movie, 300, false);
                showModalTrailer(movie, childs);
                addHoverItems(activeItems, childs);
            }
        });
    })

    const trlScreenData = [25, 50, 50, 100];
    addArrowsMove(arrowsTrailer, trlScreenData, rowConfigs(trailerItems[0].parentElement))
}())

// MODELO PARA TODOS CARTÕES DOS ITENS
const rowsState = []
, rows = query('.row')
, cardNode = ['img', 'h3', 'p', 'p'];

// EXECUTA TODAS AS LIGACÕES DA API
Promise.all(getAllLists()).then(lists => {
    lists.map((list, section) => {
        const results = list.results;
        rowsState.push(rowConfigs(rows[section], section));
        if(section === 0 || section === 1) heroMain(results, section);
        results.map(item => makeCardsMain(rowsState[section].row, cardNode, item))
        addMoveSections(rowsState[section]);
    })
});
