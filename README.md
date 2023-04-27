# Final Project

***Deadline: Thu, 15 June 2023, 23:59***

## Topic

Choose a topic to your liking for your very own DApp project.  
If you have no preference for any topic, you may build on the TU Wien Beer Bar by either replacing parts and/or
extending it. For example, this could be a pub quiz, an extended beer supply or an extended voting board.

## Grading

We consider the following aspects:

- Documentation: Provide the documentation of your project by completing the project details in the `NOTES.md` on git.
  Add further files as necessary.
- Complexity: The project should be non-trivial. Rather, it should make use of mappings, roles with RBAC, modifiers,
  Ether and tokens when reasonable. Moreover, it should provide a simple web interface for interaction with the
  contract.
- Correctness: The project should use correct math (big numbers, overflow), include test cases and ensure that neither
  any ether nor any tokens are lost.
- Security: Try to avoid that the contract can be depleted by any method used in the challenges.
- Originality: We would like your projects to be distinguishable from reproductions, clones, forgeries, or derivative
  works. On a side note: we've already seen too many casinos.

We place less value on a fancy WebUI, as it is not part of the LVA.

**Your project is complex enough if 35 hours of effort are understandable for us.**

# Tasks

# Project Outline (5 Points)

***Deadline: Thu, 11 May 2023, 23:59***

The project outline is meant to help you with the scope and complexity of your project.

Prepare and submit an outline for your chosen topic on TUWEL.
Use the provided markdown template on TUWEL and fill out the provided bullet points.

Furthermore, we provide some sample outlines on TUWEL, which are meant to give you a starting point only and fire up
your creativity.

Optionally, if you can't come up with an idea on your own, you can submit one of the sample outlines.  
***However, in this case, no points will be awarded for this task.***

You can also take just parts of the samples, leading to point reductions only.

Regarding the complexity of your project, please consider as a typical breakdown for your efforts:

- 15h Contract development
- 5h Contract test cases
- 5h Frontend development
- 5h Testing and deploying
- 5h Setup of GitLab, Truffle, etc.

# Implementation (20 Points)

Implement your chosen topic as described in your project outline.

***Keep the grading aspects in mind.***

See the `HOWTO` section for further implementation notes.
Maybe also revisit the section `Hints for development:` in the `README.md` from your Beer Bar project.

# Submission and Presentation

- Deploy your contracts to the LVA-chain, e.g. by `truffle migrate --network lva`.

- If you use roles, please make us - the person at `addresses.getPublic(94)` - an owner/admin of the contract.

- Make sure that the frontend is deployed to your GitLab Pages instance and works properly.

- Make sure you have committed all your changes to the `main`-branch of your Git-Repository `git.sc.logic.at`!

- Present your project in the review session on `Thu, 22 June 2023`. Reserve a time slot via TUWEL.

---

# HOWTO

This repository contains an initialized Truffle project.

Run `npm install` to install all dependencies.

Recommended web3.js version: v1.9.0

## Truffle Development

Implement your contracts in the `contracts/` folder. You can compile them with `npm run compile`.
Update your migration scripts as well as needed under `migrations/`.

Implement your test cases in the `tests/` folder. You can run them with `npm run test`.
The Gitlab CI is configured to run your tests on every commit.

With `npm run dev` you can start a local Truffle development chain.

## Web Frontend

### Technology Stack

You are free to implement your web interface to your liking. You can use static JavaScript files (similar to the BeerBar
Plain Version) or any other suitable framework like e.g. [Angular](https://angular.io/), [Vue](https://vuejs.org/)
or [Next.js](https://nextjs.org/).

### GitLab CI

The GitLab CI is configured similar to the Beer Bar project. It will build your frontend and deploy it to your GitLab
Pages instance <https://final.pages.sc.logic.at/e11809647>.   
For doing so, it assumes the frontend root to be directly under `/frontend` and a proper build script available via
`npm run build` producing a production ready build under `frontend/build`.

Of course, you can adjust that to your liking.

### ABIs

Furthermore, every frontend needs the contract ABIs for interaction. Similar to the Beer Bar project
a script `npm run coco` is available in `package.json`, that will compile your contracts
and copies the artifacts to `/frontend/src/abi`.  
However, you can directly specify another output path for the contract artifacts in `truffle-config.js`.
This has the advantage, that you may not need to call `npm run coco` anymore, because then `truffle compile`
or `truffle migrate` will already output the artifacts in the specified path. You usually will call `migrate` in
the Truffle dev console anyway, when re-deploying your updated contracts.
