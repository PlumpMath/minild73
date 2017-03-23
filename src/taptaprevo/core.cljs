(ns taptaprevo.core
  (:require [play-cljs.core :as p]
    [taptaprevo.beats]
    [taptaprevo.dragdrop :as dd]))

(defonce game (p/create-game 500 500))
(defonce state (atom {}))

(def main-screen
  (reify p/Screen
    (on-show [this]
      (reset! state {:text-x 20 :text-y 30}))
    (on-hide [this])
    (on-render [this]
      (p/render game
        [[:fill {:color "lightblue"}
          [:rect {:x 0 :y 0 :width 500 :height 500}]]
         [:fill {:color "black"}
          [:text {:value "Hello, world!" :x (:text-x @state) :y (:text-y @state) :size 16 :font "Georgia" :style :italic}]]])
      (swap! state update :text-x inc))))

; (doto game
;   (js/foo)
;   (p/start)
;   (p/set-screen main-screen))

(defn hey [name content]
  (.log js/console (str "hey!  " name))

  (js/process name content))

(dd/set-up-drop-zone "dropzone" hey)
