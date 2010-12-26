Ext.ux.grid.FilterRow
=====================

Plugin for Ext.grid.GridPanel that places form fields right below grid
headers, where they can be used for filtering grid contents.

Licensed under [GNU General Public License v3][gpl3].

How it works
------------

Let's create a grid that displays list of persons and allows filtering
by first- and last name.  For that we define a GridPanel as always,
but inside column definitions, we add a special "filter" property,
that is detected by FilterRow plugin:

    var grid = new Ext.grid.GridPanel({
      store: someStore,
      columns: [
        {
          dataIndex: "fname"
          header: "First name",
          filter: {}
        },
        {
          dataIndex: "lname"
          header: "Last name",
          filter: {}
        }
      ],
      plugins: ["filterrow"]
    });

That's it!  Our grid now has a row of editors below its headers and
the grid is filtered right as you type.

This is the default behaviour, that's because the filter config is
completely empty.  But we can fill it out to match the particular
needs of our application.

### Regex filters

The most useful of the config options is **test:** - it defines the
logic for filtering the column.  It's default value is `"/{0}/i"` -
this looks like a regular expression and it almost is.  It's a
template for the regular expression that will be used to filter the
grid.  `{0}` is a placeholder for the value read from the field of our
filter.  For example when user types in `"Mary"` this template will
create a regular expression `/Mary/i`.

If you know regular expressions, it should be pretty obvious now.  But
for start, here's a filter that is a) case sensitive, and b) matches
the beginning, instead of any part of the string:

    filter: {
      test: "/^{0}/"
    }

### Filtering functions

But regexes aren't the only option here.  For complete control you can
declare a function to decide which rows to include and which not:

    filter: {
      test: function(filterValue, rowValue) {
        return filterValue <= rowValue;
      }
    }

The above example excludes all rows having smaller value than the one
entered to filter field.

### Different field types

So far we have been using TextFields for filtering, but we can easily
use others.  This is done through the **field:** config option:

    filter: {
      field: {
        xtype: "combo",
        ... all kind of combo box config ...
      },
      fieldEvents: ["select"],
    }

Note that in addition to `field:` we also define `fieldEvents:` - these
are the events of field which trigger the filtering of grid.  By
default the events array contains only "keyup" event which works well
for TextFields, but for other types you might need to specify your
own.

### Full control

Finally you can take full control of the filtering process by setting
the `autoFilter: false` and implementing handler for the "change"
event.  For example, to perform the filtering on the server side, you
might configure the plugin like this:

    var filterRow = new Ext.ux.grid.FilterRow({
      autoFilter: false,
      listeners: {
        change: function(data) {
          store.load({
            params: data
          });
        }
      }
    });

This should be enough for introduction.  Read the source for full
documentation of different config options.


A picture speaks a thousand words
---------------------------------

* [Live example][live]


Thanks
------

* Based on [durlabh's code from ExtJS forum][post].
* Thanks to [Saneth][saneth] for patch on better look.
* Thanks to [Jüri Tarkpea][jyri] for the idea of using magnifier-glass
  image inside filter fields.
* Thanks to [shivaaqua][shivaaqua] for help in making FilterRow work
  with ExtJS 3.3.
* Thanks to [Ed Spencer][ed] for providing insight into GridView
  changes in Ext 3.3.
* And thanks to everybody for reporting bugs.


Changelog
---------

* 0.6 version
  * Fixed bug with comboboxes in FilterRow not working in IE.
  * Fixed bug with renaming column headers.

* 0.5 version
  * Now working with ExtJS 3.3.
  * The default test is now `"/{0}/i"` instead of `"/^{0}/i"` -
    that's more generic and in my experience more often needed.
  * By default all filter fields now contain a magnifier-glass icon.
    This can be turned off per field using the `showFilterIcon`
    option.
  * Test function receives additional third argument - the record.
  * Automatic refiltering is now off by default. It caused too many
    problems. If you want, you can enable it by setting
    `refilterOnStoreUpdate: true`.
  * Fixed bug with grids that aren't immediately rendered.

* 0.4 version
  * Renamed `events` config option to `fieldEvents`.  Use of the
    property name "events" on an object that inherits from
    Ext.util.Observable was a serious mistake.
  * When store is reloaded or data is added with add(), addSorted(),
    or insert() methods, the store will automatically reapply its
    filter. (This only applies when `autoFilter` config option is
    true, which it is by default).

* 0.3.1 version
  * Reintroduced "change" event.
  * Added `autoFilter` config option.
  * Together these can be used to implement some custom filtering
    schema, for example filtering of a remote store.

* 0.3 version
  * Greatly simplified the creation of filters.  The logic for each
    filter is now defined separately and combined automatically.
    Actually, often the logic doesn't even need to be defined, just
    using the defaults might be enough.
  * Plugin registered with Ext.ComponentMgr as "filterrow".
  * Each filter is now an instance of FilterRowFilter class.
  * Filter fields can be specified with config objects.
  * Column id-s no more required.
  * Removed "change" event from FilterRow.
  * Use of FilterRow for anything else than filtering no more supported.

* 0.2 version
  * Filter editors are defined inside grid columns. No more global ID-s.
  * For each editor an event name can be configured. So you can
    configure TextField to trigger the FilterRow "change" event on
    each keypress, while for ComboBox just listen the "change" event.
  * The "change" event now only contains the data object with values
    of each field. No more {filter: ..., data: ...}, just the data
    part of that.
  * Finally added some documentation.
  * Look-and-feel improvement by [Saneth][saneth].

* 0.1 version
  * Initial version by [durlabh][post] (I'll call it 0.1).

[gpl3]: http://www.gnu.org/licenses/gpl.html
[post]: http://www.extjs.net/forum/showthread.php?t=55730
[saneth]: http://www.extjs.net/forum/showthread.php?p=438457#post438457
[live]: http://triin.net/temp/filter-row/
[jyri]: http://tarkpea.tumblr.com/
[shivaaqua]: https://github.com/nene/filter-row/issues/closed#issue/1/comment/485585
[ed]: http://edspencer.net/
