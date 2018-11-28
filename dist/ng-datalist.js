/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
//-----------------------------------------------------------------------------//
//                          ANGULAR DATALIST DIRECTIVE                         //
//-----------------------------------------------------------------------------//
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////

/**------------------------------------------------------------------------------
 * @name ngDatalist
 * @author Przemysław Hardyn
 * @description Simple datalist directive.
 * @license MIT Licence <http://creativecommons.org/licenses/MIT/>
 ------------------------------------------------------------------------------*/

angular.module('ng-datalist', [])
  .directive('ngDatalist', ['$timeout', '$window', '$rootScope', ngDatalist]);

function ngDatalist ($timeout, $window, $rootScope) {
  return {
    restrict: 'E',
    replace: true,
    require: 'ngModel',
    scope: {
      items: '=?',         /** @type {Array}   */
      fetchItems: '&?',         /** @type {function}   */
      ngModel: '=',            /** @type {string}  */
      fieldRequired: '=?req',   /** @type {boolean} */
      styling: '=styling',      /** @type {boolean} */
      placeholder: '@?placeholder',      /** @type {string} */
      inputClass: '@?inputClass',         /** @type {string} */
      ngDisabled: '=?',            /** @type {string}  */
      width: '=?',
    },
    link: function (scope, elem, attrs, ctrl) {
      // --------------------------------------------------------- //
      //                      SCOPE & VARIABLES                    //
      // --------------------------------------------------------- //
      // Functions binded to the template:
      scope.selectItem = selectItem;
      scope.showList = showList;
      scope.hideList = hideList;
      scope.highlightItem = highlightItem;
      scope.clearHighlightedItem = clearHighlightedItem;
      scope.keydown = keydown;
      scope.change = change;
      if (scope.placeholder) {
        elem.find('input').attr('placeholder', scope.placeholder);
      }
      scope.$on('openNewList', function(event) {
        hideList(event);
      });
      elem.find('input').on('input propertychange', function() {
        scope.ngModel = this.value;
        ctrl.$setViewValue(scope.ngModel);
        scope.inputItem = this.value;
        scope.$evalAsync();
      });

      // copy array
      scope.itemsSnap = [];
      if (Array.isArray(scope.items)) {
        scope.itemsSnap = scope.items.slice(0);
      }

      // Expose dependencies in the directive:
      var domReady = $timeout;

      // Set field to not required if attribute set to false
      // or not provided.
      if (scope.fieldRequired !== true) {
        scope.fieldRequired = false;
      }

      // Basic color config:
      var borderColor = '#DDDDDD';
      var highlightColor = '#DDDDDD';

      // --------------------------------------------------------- //
      //                           STYLES                          //
      // --------------------------------------------------------- //
      // Use default styles only if custom not set:
      if (scope.styling !== false) {
        // Container element styles:
        scope.containerStyle = {
          'display': 'inline-block',
          'position': 'relative',
          'box-sizing': 'border-box',
          'height': '32px'
        };

        // Input element styles:
        scope.inputStyle = {
          'box-sizing': 'border-box',
          'height': '32px',
          'padding': '5px',
          'margin': '0px'
        };
        if (scope.width) {
          scope.inputStyle.width = (+scope.width || 0) + 'px';
        }
        // List element styles:
        scope.ulStyle = {
          'list-style-type': 'none',
          'padding': '0',
          'margin': '0',
          'display': 'none',
          'position': 'absolute',
          'top': '32px',
          'background-color': '#FFFFFF',
          'overflow-y': 'auto',
          'border-left': '1px solid '+borderColor,
          'border-bottom': '1px solid '+borderColor,
          'border-right': '1px solid '+borderColor,
          'z-index': 10
        };

        // List items styles:
        scope.liStyle = {
          'display': 'block',
          'padding': '5px',
          'cursor': 'pointer',
          'box-sizing': 'border-box'
        }
      }

      // --------------------------------------------------------- //
      //                          FUNCTIONS                        //
      // --------------------------------------------------------- //
      /**
       * @function selectItem
       * @description Copy data from selected list item to the model.
       * @param {Object} event Click event used to prevent bubbling.
       * @param {string} item  Text to be copied to the model.
       */
      function selectItem (event, index) {
        event.stopPropagation();
        scope.ngModel = elem.find('li').eq(index).text();
        ctrl.$setViewValue(scope.ngModel);
        elem.find('ul').css('display', 'none');
        elem.find('input').triggerHandler('focus');
      }

      /**
       * @function showList
       * @description Show ul DOM element containing the list.
       * @param {Object} event Click event used to prevent bubbling.
       */
      var cursor = null;
      function showList (event) {
        event.stopPropagation();
        $rootScope.$broadcast('openNewList');

        if (scope.fetchItems) {
          scope.fetchItems({items: scope.itemsSnap});
        }
        var maxHeight = $window.innerHeight - event.target.getBoundingClientRect().top - 40;
        var ul = elem.find('ul');
        ul.css('max-height',  maxHeight + 'px')
        .css('display', 'block');
        scope.liStyle.width = event.target.clientWidth + 'px';
        scope.inputItem = '';
        cursor = null;
      }

      /**
       * @function hideList
       * @description Hide ul DOM element containing the list.
       * @param {Object} event Click event used to prevent bubbling.
       */
      function hideList (event) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        elem.find('ul').css('display', 'none');
      }

      /**
       * @function highlightItem
       * @description Highlight hovered list item.
       * @param {Object} event Mouseover event used to prevent bubbling.
       * @param {Number} index Used to locate current list item in the DOM tree.
       */
      function highlightItem (event, index) {
        event.stopPropagation();
        var li = elem.find('li');
        if (index < 0 || index >= li.length) {
          return;
        }
        li.css({
          'background-color': 'transparent'
        });
        li.eq(index).css({
          'background-color': borderColor
        });
        cursor = index;
      }

      /**
       * @function clearHighlightedItem
       * @description Remove item highlight on mouseleave.
       * @param {Object} event Mouseleave event used to prevent bubbling.
       */
      function clearHighlightedItem (event, index) {
        event.stopPropagation();
        var li = elem.find('li');
        if (index < 0 || index >= li.length) {
          return;
        }
        li.eq(index).css({
          'background-color': 'transparent'
        });
      }
      function keydown(event) {
        if (13 === event.keyCode) {
          //enter
          if (null !== cursor) {
            selectItem(event, cursor);
          }
        }else if (40 === event.keyCode) {
          //down
          if (null !== cursor) {
            highlightItem(event, cursor + 1);
          }else {
            highlightItem(event, 0);
          }
        }else if (38 === event.keyCode) {
          //up
          if (null !== cursor) {
            highlightItem(event, cursor - 1);
          }
        }else if (37 === event.keyCode || 39 === event.keyCode || 8 === event.keyCode) {
          // left, right, backspace
          clearHighlightedItem(event, cursor);
          showList(event);
        }else if (9 === event.keyCode) {
          // tab
          hideList(event);
        }
      }

      function change() {
        // ng-change発生時はoninputイベントが発生しないため、oninputと同じ処理
        ctrl.$setViewValue(scope.ngModel);
        scope.inputItem = scope.ngModel;
      }

      // https://github.com/jquery/jquery/blob/2d4f53416e5f74fa98e0c1d66b6f3c285a12f0ce/external/sizzle/dist/sizzle.js#L850
      function jq_contains(a, b) {
        if (a.contains) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!( bup && bup.nodeType === 1 && (
                adown.contains ?
                    adown.contains( bup ) :
                    a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
            ));
        }else {
            if ( b ) {
                while ( (b = b.parentNode) ) {
                    if ( b === a ) {
                        return true;
                    }
                }
            }
            return false;
        }
      }

      function hideListImpl(event) {
        var contains = jq_contains(elem, event.target);
        if (!contains) {
          scope.hideList(event);
        }
      }

      // --------------------------------------------------------- //
      //                           EVENTS                          //
      // --------------------------------------------------------- //
      // Bind click event to the document to hide list:
      domReady(function () {
        // ng-datalistが複数あると複数個登録されることに注意
        document.addEventListener('click', hideListImpl);
      })

      // Remove document click event on destroy:
      elem.on('$destroy', function () {
        document.removeEventListener('click', hideListImpl);
      });
    },
    template:
    '<div ng-style="containerStyle" class="ng-datalist-container">'+
      '<input type="text" '+
             'class="ng-datalist-input {{inputClass}}" '+
             'ng-required="fieldRequired" '+
             'ng-model="ngModel" '+
             'ng-click="showList($event)" '+
             'ng-style="inputStyle" '+
             'ng-change="change($event)" '+
             'ng-keydown="keydown($event)" '+
             'ng-disabled="ngDisabled">'+
      '<ul ng-style="ulStyle" class="ng-datalist-list">'+
        '<li ng-repeat="item in itemsSnap | filter: inputItem track by $index" '+
            'class="ng-datalist-item" '+
            'ng-click="selectItem($event, $index)" '+
            'ng-style="liStyle" '+
            'ng-mouseover="highlightItem($event, $index)" '+
            'ng-mouseleave="clearHighlightedItem($event, $index)">{{ item }}</li>'+
      '</ul>'+
    '</div>'
  }
}
