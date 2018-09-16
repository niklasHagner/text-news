"use strict";

module.exports = {
  getTopics
};

function getTopics() {
  return [
    {title: "news", query: "news"},
    {title: "tech", query: "tech"},
    {title: "politics", query: "politics"},
    {title: "fun", query: "entertainment"},
    {title: "web", query: "web-design"},
    {title: "art", query: "art"},
    {title: "design", query: "design"},
    {title: "gadgets", query: "gadgets"},
    {title: "food", query: "cooking"}
  ];
}
