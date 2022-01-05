$("#hidden-menu").hide()

$("#show").on('click', function() {
  $("#hidden-menu").toggle({
  },500);
});

$("#show-menu").on('click', function() {
  $("#hidden-menu").toggle({
  },500);
});
