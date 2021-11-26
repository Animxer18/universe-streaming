const API = {
    API_URL: 'https://api.themoviedb.org/',
    API_KEY: 'api_key=8575f881e26d32c0677395735bbe44b7',
    IMG_URL: 'https://image.tmdb.org/t/p/w'
}

function createUrl(mode, id, trailer){
    const options = trailer ? '/videos' : ''
    , extra = mode === 'discover' ? getTrailerExplorer(1) : '';
    return `${mode}/${id + options}?${API.API_KEY + extra}`;
}

async function request(mode, id, trailer, version = 4, types, language ='pt-BR'){
    const typeUrl = createUrl(mode, id, trailer)
    , sortList = version === 4 ? '&sort_by=popularity.desc' : ''
    , lang = '&language=' + (language || 'en-US')
    , append = `&append_to_response=${types}`
    , url = `${API.API_URL + version}/${typeUrl + sortList + lang + append}`
    
    const data = await fetch(url);
    if(data.ok){
        return data.json();
    }else{
        console.log('Error')
    }
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
    console.log(item);
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
            , item = list.results[random]
            , append = 'videos,release_dates,content_ratings'

        request(item.media_type, item.id, false, 3, append).then((content) => {
            setBannerImage(content);
            setHeader(content);
        })
    })
})()