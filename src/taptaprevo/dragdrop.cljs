(ns taptaprevo.dragdrop)

(defn handle-file-select
  [evt]
    (.stopPropagation evt)
    (.preventDefault evt)
    (let [files (.-files (.-dataTransfer evt))]
      (dotimes [i (.-length files)]
        (let [rdr (js/FileReader.)
              the-file (aget files i)]
          (set! (.-onload rdr)
                (fn [e]
                  (let [file-content (.-result (.-target e))
                        file-name (if (= ";;; " (.substr file-content 0 4))
                                    (let [idx (.indexOf file-content "\n\n")]
                                      (.log js/console idx)
                                      (.slice file-content 4 idx))
                                    (.-name the-file))]
                    (.log js/console (str "file-name " file-name))
                    ;(.set storage file-name file-content)
                    ;(swap! list-of-code conj file-name)
                    )))
          (.readAsText rdr the-file)))))

(defn handle-drag-over [evt]
(.stopPropagation evt)
(.preventDefault evt)
(set! (.-dropEffect (.-dataTransfer evt)) "copy"))

(defn set-up-drop-zone [id]
(let [body (aget (.getElementsByTagName js/document "body") 0)
      zone (.createElement js/document "div")]
  (when-let [x (.getElementById js/document id)]
    (.removeChild body x))
  (.setAttribute zone "id" id)
  (.appendChild body zone)
  (.addEventListener zone "dragover" handle-drag-over false)
  (.addEventListener zone "drop" handle-file-select false)))
