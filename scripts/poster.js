const API = {
    API_URL: 'https://api.themoviedb.org/',
    API_KEY: 'api_key=8575f881e26d32c0677395735bbe44b7',
    LANGUAGE: '&language=',
    IMG_URL: 'https://image.tmdb.org/t/p/w'
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

function query(item){ 
    return document.querySelector(item);
}

function queryAll(item){
    return document.querySelectorAll(item) 
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

function setBannerImage(item){
    const bannerImage = query('.post-banner img');
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

async function getCertification(id, media){
    const rating = media === 'tv' ? '/content_ratings' : '/release_dates'
        , dates = await request(media, id + rating , false, 3);
    let brRating;
    dates.results.map(nation =>{
        if(nation.iso_3166_1 === 'BR'){
            brRating = nation.rating;
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

function getDetails(ul, item, type){
    console.log(item);
    ul.forEach(async (li, index) => {
        const detail = li.firstElementChild;
        switch (index) {
            case 0:
                detail.innerHTML = item.vote_average;
                break;
            case 1:
                const certification = await getCertification(item.id, type);
                detail.innerHTML = certification || '';
                setColorCert(certification, detail);
                break;
            case 2:
                detail.innerHTML = (item.runtime || item.episode_run_time[0]) + ' min';
                break;
            case 3:
                detail.innerHTML = getDateRelease(item).slice(0, 4);
                break;
            case 4:
                detail.innerHTML = item.number_of_seasons;
                break;
            case 5:
                detail.innerHTML = item.networks[0].name
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
        .filter((word, index) => index < 35).join(' ')
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
            , item = list.results[random];

        request(item.media_type, item.id, false, 3).then((content) => {
            setBannerImage(content);
            setHeader(content, item.media_type);
        })
    })
})()