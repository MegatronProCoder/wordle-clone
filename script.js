import { targetWords, dictionary } from "./index.js";
const guessGrid = document.querySelector("[data-guess-grid]")
const keyBoard = document.querySelector(".keyboard")
const alertContainer = document.querySelector('.alert-container')
const WORD_LENGTH = 5
const FLIP_ANIMATION_SPEED = 500
const date = new Date("01-01-2022")
const index = Math.floor(( Date.now() - date.getTime())/(1000*60*60*24));

const TARGET_WORD = targetWords[index]


function stopInteraction(){
    keyBoard.removeEventListener('click', handleKeyClick)
    document.removeEventListener('keydown',handlePress)
}
function activeTiles(){
    return guessGrid.querySelectorAll(`[data-state ="active"]`)  
}
function pressKey(key){
    const size = activeTiles().length
    if(size>=WORD_LENGTH) return;
    const nextTile = guessGrid.querySelector(':not([data-letter])')
    nextTile.dataset.state="active"
    nextTile.textContent = key
    nextTile.dataset.letter = key.toLowerCase()
}
function deleteKey(){
    const activeTilesArray = [...activeTiles()]
    const size = activeTilesArray.length
    if(size === 0){
        return;
    }
    else{
        delete activeTilesArray[size - 1].dataset.state
        delete activeTilesArray[size - 1].dataset.letter
        activeTilesArray[size-1].textContent = ""
    }
}
function guessWord(){
    return [...activeTiles()].reduce((word , activeTile )=>{
        return word + activeTile.textContent
    },"") 
}
function getLetterFrequencyAndIndexes(word) {
    const frequencyMap = {};

    // Loop through each letter in the word
    let index = 0;
    for (let letter of word) {

        // If the letter is already in the map, increment its count
        if (frequencyMap[letter]) {
            frequencyMap[letter][0]++;
            frequencyMap[letter][1].push(index)

        } else {
            // If it's not in the map, set its count to 1
            frequencyMap[letter] = [1 , [index]];
        }
        index++;
    }

    return frequencyMap;
}
function shakeAnimation(){
    const active_Tiles = [...activeTiles()]
    active_Tiles[0].classList.add('shake')
    for(let i = 0;i<WORD_LENGTH; i++ ){
        const tile = active_Tiles[i]

        tile.addEventListener("animationend", ()=>{
            tile.classList.remove('shake')
        });

        if(i>0){
            setTimeout(()=>{
                tile.classList.add("shake")
            }, 100*i)
        }  
    }
}
function winningAnimation(active_Tiles){
    active_Tiles[0].classList.add('dance')
    for(let i = 0;i<WORD_LENGTH; i++ ){
        
        const tile = active_Tiles[i]

        tile.addEventListener("animationend", ()=>{
            tile.classList.remove('dance')
        });

        if(i>0){
            setTimeout(()=>{
                tile.classList.add("dance")
            }, 100*i)
        }  
    }
}
function flipAnimation(guess){
    const active_Tiles = [...activeTiles()]
    const tilesState  = check(guess)
    stopInteraction()
    active_Tiles[0].classList.add('flip')
    for(let i = 0;i<WORD_LENGTH; i++ ){
        const tile = active_Tiles[i]

        tile.addEventListener("transitionend", ()=>{
            tile.dataset.state = tilesState[i]
            keyBoard.querySelector(`[data-key=${guess[i].toUpperCase()}]`).classList.add(tilesState[i])
            tile.classList.remove('flip')
            if(i === WORD_LENGTH-1) {
                if(TARGET_WORD === guess){ 
                    stopInteraction() 
                    alertMessage('you won')
                    winningAnimation(active_Tiles)
                } 
                else{
                    startInteraction()
                }
            }
        },{once:true});

        if(i>0){
            setTimeout(()=>{
                tile.classList.add("flip")
            }, FLIP_ANIMATION_SPEED*2*i)
        } 
        
    }
}
function alertMessage(message){
    const alertDiv = document.createElement('div')
    alertDiv.textContent = message

    alertDiv.classList.add('alert')
    alertContainer.prepend(alertDiv)
    setTimeout(()=>{
        alertDiv.addEventListener("transitionend", () => {
            alertDiv.remove()
            }, {once:true});
        alertDiv.classList.add("hide")
    }, 1000)
}

function check(guess){
    const active_tiles = activeTiles()
    const mapTargetWord = getLetterFrequencyAndIndexes(TARGET_WORD)
    const mapPresentWord = {}
    const tilesState = []
    for(let i=0; i<WORD_LENGTH;i++){
        tilesState.push('wrong-location')
    }
    for(let index=0;index<WORD_LENGTH;index++){
        const letter = guess[index]
        if(mapTargetWord[letter]){
            if(mapPresentWord[letter]){
                mapPresentWord[letter][0]++;
                mapPresentWord[letter][1].push(index)
            }else{
                mapPresentWord[letter]=[1,[index]]
            }
        }
        else{
            // letter doesnt exist
            tilesState[index] = "wrong"
        }
    }
    for(const letter in mapPresentWord){
        mapPresentWord[letter][1].forEach(elem=>{
            mapTargetWord[letter][1].forEach(value=>{
                if(elem === value){
                    tilesState[value] = 'correct'
                }
            })
        })
    }
    for(const letter in mapPresentWord){
        
        let freq = mapPresentWord[letter][0]
        let diff = 0;
        if(freq>mapTargetWord[letter][0]){
            for(let i in mapPresentWord[letter][1]){
                const value = mapPresentWord[letter][1][i]
                if(active_tiles[value].dataset.state === 'wrong-location' && diff<freq - mapTargetWord[letter][0]){
                    tilesState[value] = 'wrong'
                    diff++;
                }
            }
        }
    }
    return tilesState
    
}
function submitGuess(){
    const size = activeTiles().length
    if (size === WORD_LENGTH) {
        const guess = guessWord().toLowerCase();
        
        if (dictionary.includes(guess)) {
            // checking with todays word
            flipAnimation(guess)
        } else {
            //  alert message animation not a word here
            alertMessage('word not present')
            shakeAnimation()
        }
    } else {
        alertMessage(`Guess must be ${WORD_LENGTH} letters long.`)
    }
}
function handleClick(target){
    if(target.matches("[data-key]")){
        pressKey(target.dataset.key)
    }
    else if(target.matches("[data-delete]")) deleteKey()
    else if(target.matches("[data-enter]")) {
        submitGuess()
    }
}
function handlePress(e){
    if (e.key === "Backspace" || e.key === "Delete") deleteKey()
    else if(e.key === "Enter") submitGuess()
    else if(e.key.match(/^[a-z]$/)) pressKey(e.key)
    

}
function handleKeyClick(e) {
     // fixed a bug here of event delegation 
    // e.target.matches(.key) for delete button wouldnt work 
    if (e.target.closest('.key')) handleClick(e.target.closest('.key'));
}
function startInteraction(){
    keyBoard.addEventListener('click', handleKeyClick)
    document.addEventListener('keydown',handlePress)
}

startInteraction();