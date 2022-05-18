// selecting required element
const element = document.getElementById("pagination");

//calling function with passing parameters and adding inside element which is ul tag
function createPagination(totalPages, page){
  let liTag = '';
  let active;
  let beforePage = page - 1;
  let afterPage = page + 1;
  // how many pages or li show before the current li
  if (page == totalPages) {
    beforePage = beforePage - 2;
  } else if (page == totalPages - 1) {
    beforePage = beforePage - 1;
  } 

  if(beforePage<0){
    beforePage=Math.abs(beforePage)
  }

  // how many pages or li show after the current li
  if (page == 1) {
    afterPage = afterPage + 2;
  } else if (page == 2) {
    afterPage  = afterPage + 1;
  }

  for (var plength = beforePage; plength <= afterPage; plength++) {
    if (plength > totalPages) { //if plength is greater than totalPage length then continue
      continue;
    }
    if (plength == 0) { //if plength is 0 than add +1 in plength value
      plength = plength + 1;
    }
    if(page == plength){ //if page is equal to plength than assign active string in the active variable
      active = "active";
    }else{ //else leave empty to the active variable
      active = "";
    }
    if (plength<totalPages){
      liTag += `<li class="numb ${active}" id="numb"><span class="activeSpan" onclick="paginationData(${plength})">${plength}</span></li>`;
    }
  }
  
  if(page <= totalPages){ //if page value is less than totalPage value by -1 then show the last li or page
    // if(page < totalPages - 2){ //if page value is less than totalPage value by -2 then add this (...) before the last li or page
    //   liTag += `<li class="dots"><span>...</span></li>`;
    // }
    liTag += `<li class="numb last ${active}" onclick="paginationData(${totalPages})"><span class="activeSpan">${totalPages}</span></li>`;
  }
  element.innerHTML = liTag; //add li tag inside ul tag

  return liTag; //reurn the li tag
  
}