// JavaScript source code
(function () {
  if (typeof angular === 'undefined') {
    return;
  }
  angular.module('bsTable', [])
    .constant('uiBsTables', {bsTables: {}})
    .directive('bsTableControl', ['$timeout','$compile','uiBsTables', function ($timeout, $compile, uiBsTables) {
    var CONTAINER_SELECTOR = '.bootstrap-table';
    var SCROLLABLE_SELECTOR = '.fixed-table-body';
    var SEARCH_SELECTOR = '.search input';
    var bsTables = uiBsTables.bsTables;
    function getBsTable (el) {
      var result;
      $.each(bsTables, function (id, bsTable) {
        if (!bsTable.$el.closest(CONTAINER_SELECTOR).has(el).length) return;
        result = bsTable;
        return true;
      });
      return result;
    }
    function horizontalScrollBarPlugin ($el, options){
        var table = $el;
        if (table[0].nodeName == 'DIV' && $('table', $el).length == 1)
            table = $('table', $el);
        var box = table.parent();
        var plug = angular.element(document.createElement('div'));
        var plugDiv = angular.element(document.createElement('div'));

        var boxScrollLeft = 0;
        var scrollDom = options.scrollDom || '#JoininBody';
        var scroller = scrollDom == '#JoininBody' ? scrollDom : window;
        var boxWidth = box.width();
        var tableWidth = table.width();

        //同步列表的宽度
        plug.css({
            'position': 'fixed',
            'bottom': '0',
            'left': box.offset().left + 'px',
            'height': '20px',
            'width': boxWidth + 'px',
            'overflow-x': 'auto',
            'overflow-y': 'hidden'
        });

        //同步滚动宽度
        plugDiv.css({
            'width': tableWidth + 'px',
            'height': '20px'
        })

        box.append(plug);
        plug.append(plugDiv);

        //初始化判断
        isShowScroll();

        function isShowScroll() {
            var topValue = box.offset().top;
            var absTop = Math.abs(topValue);
            var subBoxBottom = box.height() + topValue;
            var winh = $(scroller).height();
            var wins = $(scroller).offset().top;
            var scrollBottom = winh + wins;
            if (scrollBottom > topValue && scrollBottom < subBoxBottom) {
                //如果列表展现在页面上，则显示
                //plug.show();
                plug.removeClass('aHide');
                //同步辅助滚动条滚动值
                plug.scrollLeft(boxScrollLeft);
            }
            //if (scrollBottom < topValue || scrollBottom >= subBoxBottom) {
            else {
                //如果列表原滚动条出现或者页面没有到达列表，则隐藏此辅助滚动条
                //plug.hide();
                plug.addClass('aHide');
            }
        }

        function updata() {
            if (boxWidth != box.width()) {
                boxWidth = box.width();
                plug.css({
                    'width': boxWidth + 'px'
                });
            }
            if (tableWidth != table.width()) {
                tableWidth = table.width();
                plugDiv.css({
                    'width': tableWidth + 'px'
                })
            }
        }

        $(scroller).scroll(function () { isShowScroll(); updata(); });

        plug.scroll(function () { box.scrollLeft(plug.scrollLeft()); });

        box.scroll(function () { boxScrollLeft = box.scrollLeft(); });

        $(scroller).resize(function () {
            plug.css({
                'left': box.offset().left + 'px',
                'width': box.width() + 'px'
            });
            plugDiv.css({
                'width': table.width() + 'px'
            })
        });
    }
    
    $(window).resize(function () {
      $.each(bsTables, function (id, bsTable) {
        bsTable.$el.bootstrapTable('resetView');
      });
    });
    function onScroll () {
      var bsTable = this;
      var state = bsTable.options.state;
      bsTable.$s.$applyAsync(function () {
        state.scroll = bsTable.$el.bootstrapTable('getScrollPosition');
      });
    }
    $(document)
      .on('post-header.bs.table', CONTAINER_SELECTOR+' table', function (evt) { // bootstrap-table calls .off('scroll') in initHeader so reattach here
        var bsTable = getBsTable(evt.target);
        if (!bsTable) return;
        bsTable.$el
          .closest(CONTAINER_SELECTOR)
          .find(SCROLLABLE_SELECTOR)
          .on('scroll', onScroll.bind(bsTable));
      })
      .on('sort.bs.table', CONTAINER_SELECTOR+' table', function (evt, sortName, sortOrder) {
        var bsTable = getBsTable(evt.target);
        if (!bsTable) return;
        var state = bsTable.options.state;
        bsTable.$s.$applyAsync(function () {
          state.sortName = sortName;
          state.sortOrder = sortOrder;
        });
      })
      .on('page-change.bs.table', CONTAINER_SELECTOR+' table', function (evt, pageNumber, pageSize) {
        var bsTable = getBsTable(evt.target);
        if (!bsTable) return;
        var state = bsTable.options.state;
        bsTable.$s.$applyAsync(function () {
          state.pageNumber = pageNumber;
          state.pageSize = pageSize;
        });
      })
      .on('search.bs.table', CONTAINER_SELECTOR+' table', function (evt, searchText) {
        var bsTable = getBsTable(evt.target);
        if (!bsTable) return;
        var state = bsTable.options.state;
        bsTable.$s.$applyAsync(function () {
          state.searchText = searchText;
        });
      })
      .on('focus blur', CONTAINER_SELECTOR+' '+SEARCH_SELECTOR, function (evt) {
        var bsTable = getBsTable(evt.target);
        if (!bsTable) return;
        var state = bsTable.options.state;
        bsTable.$s.$applyAsync(function () {
          state.searchHasFocus = $(evt.target).is(':focus');
        });
      });

    return {
      restrict: 'EA',
      //scope: {bsTableControl: '='},
      link: function ($s, $el, attrs) {

        var bsTable = bsTables[$s.$id] = {$s: $s, $el: $el};
        $s.instantiated = false;

        bsTable.options = $s.$eval(attrs.bsTableControl); // evaluate config from controller
        //$el.bootstrapTable(bsTable.options);

        // $s.$watch($el, function (bstable) {
        //   $compile($el.contents())($s);
        // });

        
        $el.bind('post-body.bs.table', function () {
          $timeout(function () {
            $compile($el.find('tbody')[0])($s);
          },10);
        });

        //post-body.bs.table
        
        $s.$watch('attrs.bsTableControl', function (options) {

          bsTable.options = $s.$eval(attrs.bsTableControl);
          if (!bsTable.options) bsTable.options = {};

          //options = $s.$eval(options);

          var state = bsTable.options.state || {};

          if ($s.instantiated) $el.bootstrapTable('destroy');
          $el.bootstrapTable(angular.extend(angular.copy(bsTable.options), state));
          $s.instantiated = true;

          // Update the UI for state that isn't settable via options
          if ('scroll' in state) $el.bootstrapTable('scrollTo', state.scroll);
          if ('searchHasFocus' in state) $el.closest(CONTAINER_SELECTOR).find(SEARCH_SELECTOR).focus(); // $el gets detached so have to recompute whole chain
          horizontalScrollBarPlugin($el, bsTable.options);
        }, true);
        $s.$watch('bsTableControl.state', function (state) {
          if (!state) state = bsTable.options.state = {};
          $el.trigger('directive-updated.bs.table', [state]);
        }, true);
        $s.$on('$destroy', function () {
          delete bsTables[$s.$id];
        });
      }
    };
  }])
})();
