"use strict";

const config = require("exp-config");
const fetch = require("../fetch");
const moment = require("moment");
const logger = require("../logger");
const { getDeployedVersion } = require("./resolveContentHelpers");

const invalidUrlRegex = /[\s@|.:;+]|\/{2}/;

module.exports = {
  resolveContent,
  renderViewModel
};

async function getTypeSpecificViewData(req, content) {

  if (content) {
    return {
      template: "section",
      headers: {
        "cache-control": "no-store",
        "Edge-control": "max-age=180,dca=esi"
      }
    };
  } else {
    return {
      template: "404",
      headers: {
        "cache-control": "no-store",
        "Edge-control": "max-age=180,dca=esi"
      }
    };
  }
}

async function buildViewModel(req, res, content, page) {
  if (!content) {
    res.status(404);

    return {
      template: "404",
      meta: {
        version: getDeployedVersion()
      },
      headers: {
        "cache-control": "no-store",
        "Edge-control": "max-age=120,dca=esi"
      }
    };
  }

  const [viewData] = await Promise.all([
    getTypeSpecificViewData(req, content)
  ]);

  return {
    page,
    content,
    ...viewData
  };
}

async function renderViewModel(content, page, req, res, next) {
  let viewModel;
  try {
    viewModel = await buildViewModel(req, res, content, page);
  } catch (error) {
    logger.error(`Failure to build view model for content: ${content} on page: ${page}`, error);
    return next(error);
  }
  res.set(viewModel.headers);
  try {
    res.render(viewModel.template, viewModel, (err, html) => {
      if (err) return next(err);
      res.send(html);
    });
  } catch (error) {
    logger.error(`res.render failed for content: ${content}\nViewmodel ${viewModel}`, error);
    return next(error);
  }
}

async function resolveContent(req, res, next) {
  const fromDate = moment().subtract(24, "hours").format("YYYY-MM-DD");
  let customQueries = ""; //decodeURIComponent(req.path);
  let page = 1;
  let q = "sweden";
  const excludedDomainsQuery = "&excludeDomains=salesforce.com,elespectador.com";

  if (invalidUrlRegex.test(customQueries)) {
    return await renderViewModel(null, page, req, res, next);
  }

  page = req.query.page || page;
  page = Number(page);
  if (page > 1) {
    customQueries = `${customQueries}&page=${page}`;
  }

  q = req.query.q || q;
  customQueries = `${customQueries}&q=${q}`;

  try {
    const content = await fetch(`${config.apiUrl}everything?language=en${excludedDomainsQuery}&pageSize=50&sortBy=popularity&from=${fromDate}&apiKey=${config.APIKEY}${customQueries}`);
    await renderViewModel(content, page, req, res, next);
  } catch (error) {
    logger.error(`Failure to retrieve content: ${customQueries}`, error);
    return next(error);
  }
}
