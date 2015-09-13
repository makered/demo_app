#!/usr/bin/env bash

# Script for ensuring that CircleCI builds/deploys a single instance of a given branch or tag at a time
# This is a modified version of a CircleCI script (https://github.com/bellkev/circle-lock-test)

# sets $branch, $tag, $rest
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--branch) branch="$2" ;;
            -t|--tag) tag="$2" ;;
            *) break ;;
        esac
        shift 2
    done
    rest=("$@")
}

# reads $branch, $tag, $commit_message
should_skip() {
    if [[ "$branch" ]] && [[ ! "$CIRCLE_BRANCH" =~ ^$branch* ]]; then
        echo "Not on branch $branch. Skipping..."
        return 0
    fi

    if [[ "$tag" && "$commit_message" != *\[$tag\]* ]]; then
        echo "No [$tag] commit tag found. Skipping..."
        return 0
    fi

    return 1
}

# reads $branch, $tag
# sets $jq_prog
make_jq_prog() {
    local jq_filters=""

    if [[ $branch ]]; then
        jq_filters+=" and (.branch | startswith(\"$branch\"))"
    fi

    if [[ $tag ]]; then
        jq_filters+=" and (.subject | contains(\"[$tag]\"))"
    fi

    jq_prog=".[] | select(.build_num < $CIRCLE_BUILD_NUM and (.status | test(\"running|pending|queued\")) $jq_filters) | .build_num"
}


if [[ "$0" != *bats* ]]; then
set -e
set -u
set -o pipefail

    branch=""
    tag=""
    rest=()
    api_url="https://circleci.com/api/v1/project/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME?circle-token=$CIRCLE_TOKEN&limit=100"

    parse_args "$@"
    commit_message=$(git log -1 --pretty=%B)
    if should_skip; then exit 0; fi
    make_jq_prog

    echo "Checking for running builds..."

    builds=$(curl -s -H "Accept: application/json" "$api_url" | jq "$jq_prog")
    if [[ $builds ]]; then
        echo "Build $builds is already running for this branch or tag. Please try again later."
        exit 1
    fi

    echo "Acquired lock"

    if [[ "${#rest[@]}" -ne 0 ]]; then
        "${rest[@]}"
    fi
fi
