#!/usr/bin/env node

import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;

if (!MOODLE_API_URL || !MOODLE_API_TOKEN) {
  console.error('Missing environment variables: MOODLE_API_URL or MOODLE_API_TOKEN');
  process.exit(1);
}

const axiosInstance = axios.create({
  baseURL: MOODLE_API_URL,
  params: {
    wstoken: MOODLE_API_TOKEN,
    moodlewsrestformat: 'json'
  },
  timeout: 30000
});

async function fetchAllCourses() {
  console.log('Fetching all courses from Moodle...');
  
  try {
    const response = await axiosInstance.get('', {
      params: {
        wsfunction: 'core_course_get_courses',
        moodlewsrestformat: 'json'
      }
    });

    if (response.data && response.data.exception) {
      console.error('Moodle API error:', response.data.message || 'Unknown error');
      return;
    }

    const courses = Array.isArray(response.data) ? response.data : [];
    console.log(`Found ${courses.length} courses`);

    // Save raw data
    fs.writeFileSync('all-courses-raw.json', JSON.stringify(response.data, null, 2));
    console.log('Saved raw data to all-courses-raw.json');

    // Save formatted data
    const formattedCourses = courses.map(course => ({
      id: course.id,
      shortname: course.shortname,
      fullname: course.fullname,
      categoryid: course.categoryid,
      startdate: course.startdate ? new Date(course.startdate * 1000).toISOString() : null,
      enddate: course.enddate ? new Date(course.enddate * 1000).toISOString() : null,
      visible: course.visible,
      summary: course.summary ? course.summary.substring(0, 200) + '...' : null,
      timecreated: course.timecreated ? new Date(course.timecreated * 1000).toISOString() : null,
      timemodified: course.timemodified ? new Date(course.timemodified * 1000).toISOString()
    }));

    fs.writeFileSync('all-courses-formatted.json', JSON.stringify(formattedCourses, null, 2));
    console.log('Saved formatted data to all-courses-formatted.json');

    // Create search index
    const searchIndex = {
      byShortname: {},
      byFullname: {},
      byCategory: {},
      byVisibility: { visible: [], hidden: [] },
      byYear: {}
    };

    courses.forEach(course => {
      // Index by shortname
      if (course.shortname) {
        searchIndex.byShortname[course.shortname.toLowerCase()] = course.id;
      }

      // Index by fullname
      if (course.fullname) {
        searchIndex.byFullname[course.fullname.toLowerCase()] = course.id;
      }

      // Index by category
      if (!searchIndex.byCategory[course.categoryid]) {
        searchIndex.byCategory[course.categoryid] = [];
      }
      searchIndex.byCategory[course.categoryid].push(course.id);

      // Index by visibility
      if (course.visible) {
        searchIndex.byVisibility.visible.push(course.id);
      } else {
        searchIndex.byVisibility.hidden.push(course.id);
      }

      // Index by year
      if (course.timecreated) {
        const year = new Date(course.timecreated * 1000).getFullYear();
        if (!searchIndex.byYear[year]) {
          searchIndex.byYear[year] = [];
        }
        searchIndex.byYear[year].push(course.id);
      }
    });

    fs.writeFileSync('courses-search-index.json', JSON.stringify(searchIndex, null, 2));
    console.log('Saved search index to courses-search-index.json');

    // Create summary report
    const summary = {
      totalCourses: courses.length,
      categories: Object.keys(searchIndex.byCategory).length,
      visibleCourses: searchIndex.byVisibility.visible.length,
      hiddenCourses: searchIndex.byVisibility.hidden.length,
      years: Object.keys(searchIndex.byYear).sort(),
      topCategories: Object.entries(searchIndex.byCategory)
        .map(([categoryId, courseIds]) => ({ categoryId, count: courseIds.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };

    fs.writeFileSync('courses-summary.json', JSON.stringify(summary, null, 2));
    console.log('Saved summary to courses-summary.json');

    console.log('\nSummary:');
    console.log(`Total courses: ${summary.totalCourses}`);
    console.log(`Categories: ${summary.categories}`);
    console.log(`Visible courses: ${summary.visibleCourses}`);
    console.log(`Hidden courses: ${summary.hiddenCourses}`);
    console.log(`Years: ${summary.years.join(', ')}`);
    
    console.log('\nTop categories:');
    summary.topCategories.forEach(cat => {
      console.log(`  Category ${cat.categoryId}: ${cat.count} courses`);
    });

  } catch (error) {
    console.error('Error fetching courses:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
  }
}

fetchAllCourses();
