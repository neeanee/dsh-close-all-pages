window.__ModuleLoader__.load({
  id: 'dsh-close-all-pages',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** `react-dom` only supplies the portal used for the panel-corner seat. */
    const ReactDOM = (() => {
      try {
        return require('react-dom')
      } catch (_unavailable) {
        return null
      }
    })()

    const NS = 'closeAllPages'

    /** Simplified Chinese copy (the key-set source of truth). */
    const zh = {
      'action.label': '关闭所有页面',
      'action.tooltip': '关闭右侧栏的所有页面',
    }

    /** English copy, key-identical to the Chinese source of truth. */
    const en = {
      'action.label': 'Close all pages',
      'action.tooltip': 'Close every page in the right sidebar',
    }

    /** Stable empty result while the right Sidebar service is not reachable yet. */
    const EMPTY_TABS = Object.freeze([])

    /**
     * Whether the panel corner could not be reached, so the header fallback is in
     * force. The panel strip is product markup rather than a public seat; when a
     * DSH version stops exposing it, the control moves to the header instead of
     * disappearing.
     */
    const corner = { missing: false, listeners: new Set() }

    /** Publish the fallback state to the header entry. */
    function publishCorner(missing) {
      if (corner.missing === missing) return
      corner.missing = missing
      for (const listener of [...corner.listeners]) listener()
    }

    /** Subscribe to the fallback state. */
    function subscribeCorner(listener) {
      corner.listeners.add(listener)
      return () => {
        corner.listeners.delete(listener)
      }
    }

    /** Read the fallback state. */
    function readCorner() {
      return corner.missing
    }

    const CSS = [
      /* Panel corner: the panel's own strip chrome is a 28px flex row, and this
         control takes the same box and gap, placed before the shipped controls. */
      '.cap_button{box-sizing:border-box;flex:none;order:-1;display:inline-flex;align-items:center;',
      'justify-content:center;width:28px;height:28px;padding:6px;line-height:1;font:inherit;',
      'color:var(--dsw-alias-label-secondary);background:transparent;border:0;',
      'border-radius:var(--dsw-radius-sm,6px);cursor:pointer}',
      '.cap_button svg{display:block;width:15px;height:15px}',
      '.cap_button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.cap_button:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid ',
      'var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#679efe));outline-offset:1px}',
      '@media (prefers-reduced-motion:no-preference){.cap_button{transition:background-color .12s ease}}',
      /* Header fallback: the 24px compact control beside the header utilities. */
      '.cap_headerButton{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;',
      'justify-content:center;width:24px;height:24px;padding:4px;line-height:1;font:inherit;',
      'color:var(--dsw-alias-label-secondary);background:transparent;border:0;',
      'border-radius:var(--dsw-radius-sm,6px);cursor:pointer}',
      '.cap_headerButton svg{display:block;width:15px;height:15px}',
      '.cap_headerButton:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.cap_headerButton:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid ',
      'var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#679efe));outline-offset:1px}',
      /* A tab actions menu row. */
      '.cap_menuItem{padding:4px 7px;text-align:left;font-family:inherit;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);',
      'color:var(--dsw-alias-label-primary);background:transparent;border:0;cursor:pointer;',
      'border-radius:var(--dsw-radius-md,8px);white-space:nowrap}',
      '.cap_menuItem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.cap_menuItem:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid ',
      'var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#679efe));outline-offset:-2px}',
    ].join('')

    /** Close glyph: open pages stacked beside a cross, legible at 15px. */
    function CloseAllGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M2.5 4.2H6.3M2.5 8H5.1M2.5 11.8H6.3',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          opacity: 0.6,
        }),
        h('path', {
          d: 'M8.6 5.4L13.9 10.7M13.9 5.4L8.6 10.7',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
      )
    }

    /**
     * The strip chrome container of one Session's right panel: the flex row that
     * already holds the fullscreen and collapse controls, found from the panel
     * markup the dock kit renders (no seat of its own exists for a third control).
     * @param sessionId - Session whose panel is looked up.
     * @returns the container, or null while the panel has not rendered.
     */
    function findStripChrome(sessionId) {
      if (typeof document === 'undefined') return null
      for (const panel of document.querySelectorAll('[data-sidebar-right-session]')) {
        if (panel.dataset.sidebarRightSession !== sessionId) continue
        const chrome = panel.querySelector('[data-dockkit-strip-chrome]')
        if (chrome !== null) return chrome
      }
      return null
    }

    /** How long the corner may stay unresolved before the header fallback takes over. */
    const CORNER_GRACE_MS = 2000

    /** Required services: the slot registry, copy, and the right Sidebar's navigation face. */
    const inject = ['slots', 'locale', 'sidebarRight']

    /**
     * Client plugin body: publish the copy and stylesheet, then contribute the
     * close-all control to the right panel's strip, a tab's actions menu, and a
     * header fallback for a DSH whose panel markup cannot be reached.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'close-all-pages: dictionaries')

      ctx.effect(() => {
        if (typeof document === 'undefined') return
        const tagId = 'dsh-close-all-pages/close-all-pages.css'
        if (document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') !== null) return
        const tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-close-all-pages'
        tag.dataset.pluginCss = tagId
        tag.textContent = CSS
        document.head.appendChild(tag)
        return () => {
          tag.remove()
          publishCorner(false)
        }
      }, 'close-all-pages: stylesheet')

      const t = ctx.locale.bind(NS)

      /** The right Sidebar's cross-plugin face, when its plugin has published it. */
      const sidebarRight = () => {
        try {
          return ctx.sidebarRight
        } catch (_unavailable) {
          return undefined
        }
      }

      /** Every tab the inventory knows for one Session. */
      const openTabsOf = (sessionId) => {
        const service = sidebarRight()
        const tabs = service?.openTabs?.getSnapshot?.() ?? EMPTY_TABS
        return tabs.filter((tab) => tab.sessionId === sessionId)
      }

      /** Subscribe to the right Sidebar's open-tab inventory. */
      const subscribeOpenTabs = (onChange) => {
        const service = sidebarRight()
        return service?.openTabs?.subscribe?.(onChange) ?? (() => {})
      }

      /** Read the inventory without subscribing; stable identity while it does not change. */
      const readOpenTabs = () => sidebarRight()?.openTabs?.getSnapshot?.() ?? EMPTY_TABS

      /** Subscribe to the Session the right panel is showing. */
      const subscribeMounted = (onChange) => {
        const service = sidebarRight()
        return service?.mounted?.subscribe?.(onChange) ?? (() => {})
      }

      /** Read the Session the right panel is showing. */
      const readMounted = () => sidebarRight()?.mounted?.getSnapshot?.()

      /**
       * Close every page open in one Session's right Sidebar, through the same
       * per-tab close path the tabs' own controls use, so cleanup handlers and the
       * shipped layout rules (guide retention, collapse on the last page) apply.
       * @param sessionId - Session whose pages close.
       */
      const closeAllPages = (sessionId) => {
        const service = sidebarRight()
        if (service === undefined) return
        const tabIds = openTabsOf(sessionId).map((tab) => tab.tabId)
        for (const tabId of tabIds) {
          if (typeof service.closeIn === 'function') service.closeIn(sessionId, tabId)
          else if (typeof service.close === 'function') service.close(tabId)
        }
      }

      /** Whether the Session holds at least one page that can close. */
      const hasClosable = (open) => open.length > 0 && !(open.length === 1 && open[0].kind === 'guide')

      /**
       * The panel-corner control. It is rendered through the frame overlay but
       * portalled into the right panel's own strip, so it rides the panel's
       * layout, its resize and its slide, and never overlaps its neighbours.
       */
      function PanelCornerAction() {
        const sessionId = React.useSyncExternalStore(subscribeMounted, readMounted)
        const tabs = React.useSyncExternalStore(subscribeOpenTabs, readOpenTabs)
        const open = React.useMemo(
          () => (sessionId === undefined ? EMPTY_TABS : tabs.filter((tab) => tab.sessionId === sessionId)),
          [tabs, sessionId],
        )
        const closable = hasClosable(open)
        const [target, setTarget] = React.useState(null)

        React.useEffect(() => {
          if (!closable || sessionId === undefined || ReactDOM === null) {
            publishCorner(false)
            setTarget((current) => (current === null ? current : null))
            return
          }
          let cancelled = false
          const openedAt = Date.now()
          const resolve = () => {
            if (cancelled) return
            const next = findStripChrome(sessionId)
            setTarget((current) => (current === next ? current : next))
            publishCorner(next === null && Date.now() - openedAt > CORNER_GRACE_MS)
          }
          resolve()
          // The strip is rebuilt when the session, pane split or panel changes;
          // a light re-check keeps the portal on the live container.
          const timer = window.setInterval(resolve, 500)
          window.addEventListener('resize', resolve)
          return () => {
            cancelled = true
            window.clearInterval(timer)
            window.removeEventListener('resize', resolve)
          }
        }, [closable, sessionId])

        if (!closable || target === null || ReactDOM === null) return null
        const label = t('action.label')
        return ReactDOM.createPortal(
          h(
            'button',
            {
              type: 'button',
              className: 'cap_button',
              'data-close-all-pages': '',
              'aria-label': label,
              title: t('action.tooltip'),
              onClick: () => closeAllPages(sessionId),
            },
            h(CloseAllGlyph),
          ),
          target,
        )
      }

      /**
       * The header fallback, drawn only while the panel corner cannot be reached.
       * It uses the session header utilities seat, which every product version keeps.
       */
      function HeaderFallbackAction({ sessionId }) {
        const fallback = React.useSyncExternalStore(subscribeCorner, readCorner)
        const tabs = React.useSyncExternalStore(subscribeOpenTabs, readOpenTabs)
        const open = React.useMemo(
          () => tabs.filter((tab) => tab.sessionId === sessionId),
          [tabs, sessionId],
        )
        if (!fallback || !hasClosable(open)) return null
        const label = t('action.label')
        return h(
          'button',
          {
            type: 'button',
            className: 'cap_headerButton',
            'data-close-all-pages': '',
            'aria-label': label,
            title: t('action.tooltip'),
            onClick: () => closeAllPages(sessionId),
          },
          h(CloseAllGlyph),
        )
      }

      /**
       * The same operation inside a tab's actions menu, drawn only while the
       * Session holds more than one page, so a lone page keeps its own Close row.
       */
      function CloseAllPagesMenuItem({ sessionId, dismiss }) {
        const tabs = React.useSyncExternalStore(subscribeOpenTabs, readOpenTabs)
        const open = React.useMemo(
          () => tabs.filter((tab) => tab.sessionId === sessionId),
          [tabs, sessionId],
        )
        if (open.length < 2) return null
        return h(
          'button',
          {
            type: 'button',
            role: 'menuitem',
            className: 'cap_menuItem',
            'data-close-all-pages-menu': '',
            onClick: () => {
              dismiss?.()
              closeAllPages(sessionId)
            },
          },
          t('action.label'),
        )
      }

      ctx.effect(
        () =>
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              {
                name: 'shell.overlay',
                id: 'close-all-pages',
                order: 0,
                locale: NS,
              },
              PanelCornerAction,
            ),
          ),
        'close-all-pages: panel corner action',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('conversation.session.header.utilities', () =>
            ctx.slots.register(
              {
                name: 'conversation.session.header.utilities',
                id: 'close-all-pages',
                order: 20,
                locale: NS,
              },
              HeaderFallbackAction,
            ),
          ),
        'close-all-pages: header fallback',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.tab.menu.item', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.tab.menu.item',
                id: 'close-all-pages',
                order: 12,
                locale: NS,
              },
              CloseAllPagesMenuItem,
            ),
          ),
        'close-all-pages: tab menu action',
      )
    }

    return { inject, apply }
  },
})
