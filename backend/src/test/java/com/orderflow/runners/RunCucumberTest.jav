package com.orderflow.runners;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = io.cucumber.core.options.Constants.GLUE_PROPERTY_NAME, value = "com.orderflow.steps")
public class RunCucumberTest {
}