$(document).ready(function () {
  var e =
    "undefined" != typeof sub_sub_folder && "true" == sub_sub_folder
      ? "../../../components/components/components/"
      : "undefined" != typeof sub_folder && "true" == sub_folder
      ? "../../components/components/"
      : "undefined" != typeof folder && "true" == folder
      ? "../components/"
      : "";
  $(".header-component").load(e + "components/header.html"),
  $(".footer-component").load(e + "components/footer.html");
  $(".loading").load(e + "components/loader.html");
});

$('input[type="file"]').each(function(){
  // Refs
  var $file = $(this),
      $label = $file.next('label'),
      $labelText = $label.find('span'),
      labelDefault = $labelText.text();
  
  // When a new file is selected
  $file.on('change', function(event){
    var fileName = $file.val().split( '\\' ).pop(),
        tmppath = URL.createObjectURL(event.target.files[0]);
    //Check successfully selection
		if( fileName ){
      // $label.addClass('file-ok').css('background-image', 'url(' + tmppath + ')');
      $label.html('<img src="' + tmppath + '" />');;
			$labelText.text(fileName);
    }else{
      $label.removeClass('file-ok');
			$labelText.text(labelDefault);
    }
  });
  
// End loop of file input elements  
});



