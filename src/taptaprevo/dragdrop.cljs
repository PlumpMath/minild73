(ns taptaprevo.dragdrop)

(defn handle-file-select
  [f evt]
    (.stopPropagation evt)
    (.preventDefault evt)
    (let [files (.-files (.-dataTransfer evt))
          rdr (js/FileReader.)
          the-file (aget files 0)]
      (set! (.-onload rdr)
            (fn [e]
              (let [file-content (.-result (.-target e))
                    file-name (.-name the-file)]
                (f file-name file-content))))
      (.readAsArrayBuffer rdr the-file)))

(defn handle-drag-over [evt]
(.stopPropagation evt)
(.preventDefault evt)
(set! (.-dropEffect (.-dataTransfer evt)) "copy"))

(defn set-up-drop-zone [id f]
(let [body (aget (.getElementsByTagName js/document "body") 0)
      zone (.createElement js/document "div")]
  (when-let [x (.getElementById js/document id)]
    (.removeChild body x))
  (.setAttribute zone "id" id)
  (.appendChild body zone)
  (.addEventListener zone "dragover" handle-drag-over false)
  (.addEventListener zone "drop" (partial handle-file-select f) false)))
