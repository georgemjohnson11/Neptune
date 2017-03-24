/*
 Editor Support . JS
 Function Directory

 Function                    Order
 ---------------------------------
 changeSpecifyTabs()             1
 changeDesignTabs()              2
 saveEditorContent()             3
 pre_pushFileToEditor()          4
 pushFileToEditor()              5
 fill_editor()                   6
 translateLFR()                  7
 compileMINT()                   8
 generateUCF_UI()                9
 generateUCF()                   10
 loadPreviousProject()           11
 nameProject()                   12
 baseName()                      13
 color_ui()                      14


 This file holds all functions related to the editor and its function.
 */

localStorage.WORKSPACE = '58cc70c3ce8f0320cc147ba9';
localStorage.FILE = 'hello_world_lfr.v';
localStorage.CONFIG = 'default_constraint_file.JSON';


function loadToEditor(id,editor,session)
{
    $.post('/api/Read_Bucket_Object', {Target_Object_KEY: id}, function (data)
    {
        session.setValue(data);
    });
}


function initializeEditor()
{
    var editor_specify = ace.edit("editor_specify");
    editor_specify.setTheme("ace/theme/crimson_editor");
    editor_specify.setOptions({
        fontFamily: "monospace",
        fontSize: "12pt"
    });
    var MainSession = ace.createEditSession('MainSession', "ace/mode/verilog");
    editor_specify.setSession(MainSession);

    $.post('/api/Read_Bucket_Object', {Target_Object_KEY: localStorage.FILE}, function (data)
    {
        editor_specify.setValue(data);
    });

    EDITOR = {editor: editor_specify, session: MainSession};
    return EDITOR;
};

function save(editor,session)
{
    var data = session.getValue();
    $.post('/api/Update_Bucket_Object', {Target_Object_KEY:localStorage.FILE,Target_Object_STREAM:data}, function(data) {});
}

function dojob(editor,session,jobtype)
{
    save(editor,session);
    $.post('/api/preCompileFileTransfer',{transferType:'lfr',job:localStorage.FILE,config:localStorage.CONFIG},function(data){
        $.post('/api/translate');
    });
    //$.post('/api/translateLFR',{filP})
}

function changeSpecifyTabs(Editor,Tab_To_Switch_To,SessionArray)
{
    switch (Tab_To_Switch_To)
    {
        case 'LFRtab':
            document.getElementById('LFRtab').className = 'active';
            document.getElementById('UCFtab').className = '';
            localStorage.specify_editor_state = 'specifyLFR';
            Editor.setSession(SessionArray[0]);
            if (localStorage.lfr_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
        case 'UCFtab':
            document.getElementById('LFRtab').className = '';
            document.getElementById('UCFtab').className = 'active';
            localStorage.specify_editor_state = 'specifyUCF';
            Editor.setSession(SessionArray[1]);
            if (localStorage.ucf_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
    }
}

function changeDesignTabs(Editor,Tab_To_Switch_To,SessionArray)
{
    switch (Tab_To_Switch_To)
    {
        case 'MINTtab':
            document.getElementById('INItab').className = '';
            document.getElementById('MINTtab').className = 'active';
            localStorage.design_editor_state = 'designMINT';
            Editor.setSession(SessionArray[0]);
            if (localStorage.mint_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
        case 'INItab':
            document.getElementById('INItab').className = 'active';
            document.getElementById('MINTtab').className = '';
            localStorage.design_editor_state = 'designINI';
            Editor.setSession(SessionArray[1]);
            if (localStorage.ini_state == 'write')
            {
                Editor.setReadOnly(false);
            }
            else
            {
                Editor.setReadOnly(true);
            }
            break;
    }
}

function saveEditorContent(Editor_To_Save_Content,FILE_TYPE)
{
    var EDITOR_SESSION = [];
    var editor_session = '';
    var file_size = Editor_To_Save_Content.session.getLength();
    for (var i = 0; i < file_size; i++)
    {
        var tempLine = Editor_To_Save_Content.session.getLine(i);
        editor_session = editor_session + '\n' + tempLine;
        EDITOR_SESSION.push(tempLine);
    }
    switch(FILE_TYPE)
    {
        // Add starter files to workspace, and then make in S3. populate with hello world lfr and ucf. Then template a UI. then good.
        case 'specifyLFR':
            // $.post("/api/writeToFile",{fileData: editor_session, fileType: 'specifyLFR', path: localStorage.LFR},function(data){
            //     toastr.info(data, "Saved to:")
            // });
            $.post("/api/Create_Bucket_Object",{Target_Bucket_ID:'Neptune_Probe_33',Target_Bucket_KEY:'specifyLFR',Target_Bucket_BODY:editor_session});
            break;
        case 'specifyUCF':
            $.post("/api/writeToFile",{fileData: editor_session, fileType: 'specifyUCF', path: localStorage.UCF},function(data){
                toastr.info(data, "Saved to:")
            });
            break;
        case 'designINI':
            $.post("/api/writeToFile",{fileData: editor_session, fileType: 'designINI', path: localStorage.INI},function(data){
                toastr.info(data, "Saved to:")
            });
            break;
        case 'designMINT':
            $.post("/api/writeToFile",{fileData: editor_session, fileType: 'designMINT', path: localStorage.MINT},function(data){
                toastr.info(data, "Saved to:")
            });
            break;
    }
}

function pre_pushFileToEditor(path,name,type)
{
    //var path = path.substr(7,path.length);
    var filename = path.replace(/^.*[\\\/]/, '');
    var len = filename.length;
    //var len = name.length;
    var length = path.length;
    var project = path.substr(0,length-len-1);


    if (type == 'folder')
    {
        // Selected a directory
        if (path == localStorage.PROJECT)
        {
            toastr.info('You are already in this project folder','Note:');
        }
        else if (path == localStorage.WORKSPACE)
        {
            // Provide modal to change workspaces :)
        }
        else
        {
            // Be sure to check and ensure that the user isn't opening a nested folder!
            localStorage.PROJECT = path;
            file_sync();
            toastr.success(localStorage.PROJECT,'Project changed: ');
        }
    }
    else
    {
        // Selected path is a file
        if (project == localStorage.PROJECT)
        {
            switch (type)
            {
                case '.v':
                    if (window.location.pathname == '/specify')
                    {
                        localStorage.LFR = path;
                        localStorage.LFR_name = name;
                        toastr.success(localStorage.LFR,'Loading to editor:');
                        pushFileToEditor(editor_specify,'specifyLFR',LFR_tab);
                        document.getElementById('LFRtab_t').innerText = localStorage.LFR_name;
                    }
                    if (window.location.pathname == '/design')
                    {
                        toastr.warning('You are in the design stage. To edit LFR files, go to the specify stage.','Note:');
                    }

                    break;
                case '.json':
                    if (window.location.pathname == '/specify')
                    {
                        localStorage.UCF = path;
                        localStorage.UCF_name = name;
                        toastr.success(localStorage.UCF,'Loading to editor:');
                        pushFileToEditor(editor_specify,'specifyUCF',UCF_tab);
                        document.getElementById('UCFtab_t').innerText = localStorage.UCF_name;
                        template_UCF_UI();
                    }
                    if (window.location.pathname == '/design')
                    {
                        toastr.warning('You are in the design stage. To edit UCF files, go to the specify stage.','Note:')
                    }
                    break;
                case '.uf':
                    if (window.location.pathname == '/specify')
                    {
                        toastr.warning('You are in the specify stage. To edit MINT files, go to the design stage.','Note:')
                    }
                    if (window.location.pathname == '/design')
                    {
                        localStorage.MINT = path;
                        localStorage.MINT_name = name;
                        toastr.success(localStorage.MINT,'Loading to editor:');
                        pushFileToEditor(editor_design,'designMINT',MINT_tab);
                        document.getElementById('MINTtab_t').innerText = localStorage.MINT_name;
                    }
                    break;
                case '.ini':
                    if (window.location.pathname == '/specify')
                    {
                        toastr.warning('You are in the specify stage. To edit configuration files, go to the design stage.','Note:')
                    }
                    if (window.location.pathname == '/design')
                    {
                        localStorage.INI = path;
                        localStorage.INI_name = name;
                        toastr.success(localStorage.INI,'Loading to editor:');
                        pushFileToEditor(editor_design,'designINI',INI_tab);
                        document.getElementById('INItab_t').innerText = localStorage.INI_name;
                    }
                    break;
                case '.txt':
                    if (window.location.pathname == '/specify')
                    {
                        toastr.warning('You are in the specify stage. To edit configuration files, go to the design stage.','Note:')
                    }
                    if (window.location.pathname == '/design')
                    {
                        localStorage.INI = path;
                        localStorage.INI_name = name;
                        toastr.success(localStorage.INI,'Loading to editor:');
                        pushFileToEditor(editor_design,'designINI',INI_tab);
                        document.getElementById('INItab_t').innerText = localStorage.INI_name;
                    }
                    break;
            }
            // Now, pushFileToEditor?
        }
        else
        {
            localStorage.PROJECT = project;
            file_sync();
            toastr.success(localStorage.PROJECT,'Project changed: ');
        }
    }

    var file_tree_raw = scanFiles();
    var file_tree = JSON.parse(localStorage.FILE_TREE);
    $.get('../javascripts/file_tree_template.hbs', function (data)
    {
        var template = Handlebars.compile(data);
        var myhtml = template(file_tree);
        $("#file_tree").html(myhtml);
        color_ui();
    },'html');
}

function pushFileToEditor(Editor_To_Push_Toward,FILE_TYPE,session)
{
    var CONTENT_TO_PUSH = [];
    switch(FILE_TYPE)
    {
        case 'specifyLFR':
            $.post('/api/getFile',{path:localStorage.LFR},function(data)
            {
                // if (data == 'filepath_error')
                // {
                //     toastr.warning('Neptune cannot detect your LFR filepath','Workspace Error!');
                // }
                // else
                // {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);
                changeSpecifyTabs(editor_specify,'LFRtab',[LFR_tab,UCF_tab])
                // }

            });
            break;
        case 'specifyUCF':
            $.post('/api/getFile',{path:localStorage.UCF},function(data)
            {
                // if (data == 'filepath_error')
                // {
                //     toastr.warning('Neptune cannot detect your UCF filepath','Workspace Error!');
                // }
                // else
                // {
                CONTENT_TO_PUSH = data.split("\n");
                fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);
                changeSpecifyTabs(editor_specify,'UCFtab',[LFR_tab,UCF_tab])
                //}

            });
            break;
        case 'designINI':
            $.post('/api/getFile',{path:localStorage.INI},function(data)
            {
                if (data == 'filepath_error')
                {
                    toastr.warning('Neptune cannot detect your INI filepath','Workspace Error!');
                }
                else
                {
                    CONTENT_TO_PUSH = data.split("\n");
                    fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);
                    changeDesignTabs(editor_design,'INItab',[MINT_tab,INI_tab])
                }

            });
            break;
        case 'designMINT':
            $.post('/api/getFile',{path:localStorage.MINT},function(data)
            {
                if (data == 'filepath_error')
                {
                    toastr.warning('Neptune cannot detect your MINT filepath','Workspace Error!');
                }
                else
                {
                    CONTENT_TO_PUSH = data.split("\n");
                    fill_editor(CONTENT_TO_PUSH,Editor_To_Push_Toward,session);
                    changeDesignTabs(editor_design,'MINTtab',[MINT_tab,INI_tab])
                }
            });
            break;
    }
}

function fill_editor(File_To_Fill_Editor_With,Editor_To_Fill,session)
{
    // Clear Editor before adding our file
    Editor_To_Fill.setSession(session);
    Editor_To_Fill.session.setValue('');

    // We'll fill the editor line-by-line, so we needa know how many lines we're adding
    var file_size = File_To_Fill_Editor_With.length;


    for (var i = 0; i < file_size; i++)
    {
        Editor_To_Fill.session.replace({
            start: {row: i, column: 0},
            end: {row: i, column: Number.MAX_VALUE}
        }, File_To_Fill_Editor_With[i] + '\n')
    }
}

function translateLFR(fileName)
{
    localStorage.WORKFLOW_STAGE = 'design';

    fileName = fileName + '.uf';
    //var fileName = 'testingOutput.uf';

    var translate = $.post('/api/translateLFR',{filePathLFR: localStorage.LFR, filePathUCF: localStorage.UCF, filePathOut: localStorage.PROJECT, name: fileName},function(data)
    {
        var status = data.terminalStatus;
        if (status == 'Success')
        {
            $.post('/api/getFile',{path: localStorage.PROJECT + '/' + fileName},function(data)
            {
                var content = data.split("\n");
                $("#myModal_translateComplete").modal();
                editor_previewMMOutput.getSession().setMode('ace/mode/mint');
                var file_size = content.length;
                editor_previewMMOutput.session.setValue('');
                for (var i = 0; i < file_size; i++)
                {
                    editor_previewMMOutput.session.replace({
                        start: {row: i, column: 0},
                        end: {row: i, column: Number.MAX_VALUE}
                    }, content[i] + '\n')
                }
            });
        }
        if (status == 'Failure')
        {
            terminalLog('Translation Failed!');
            terminalLog('Fluigi translator was unable to process your file.');
            terminalLog('Please check your file for syntax errors.');
            terminalLog('You may review you console readout to help diagnose your error.');
        }
    });
}

function compileMINT(folderName,fileName)
{
    localStorage.WORKFLOW_STAGE = 'build';

    var outputFolder = 'design_schematics/'; //This is overwritten, intentional
    outputFolder = folderName + '/';
    var outputName = 'microfluidic'; // This is overwritten, intentional
    outputName = fileName;
    var out = outputName + '_device_flow';
    var out2 = outputName + '_device_flow.svg';

    $.post('/api/compileMint',{filePathMINT: localStorage.MINT, filePathINI: localStorage.INI, filePathUCF: localStorage.UCF, filePathLFR: localStorage.LFR, outPath: localStorage.PROJECT, name: outputFolder, base_name: outputName},function(data)
    {
        var status = data.terminalStatus;
        if (status == 'Success')
        {

            var str = localStorage.PROJECT + '/' + outputFolder + out2;

            $('#svg_flow').load('../svg_flow.svg',function()
            {
                document.getElementById('schematic_preview_flow').children[0].children[0].id = 'svg_flow_id';
                //document.getElementById('schematic_preview').children[0].children[0].id = 'svg_flow_id'
                //document.getElementById("svg_flow");
                //var panZoomTiger = svgPanZoom(document.getElementById('schematic_preview'));
                svgPanZoom(document.getElementById('svg_flow_id'));
                // var zoom = svgPanZoom(document.getElementById('schematic_preview'), {
                //       panEnabled: true
                //     , controlIconsEnabled: false
                //     , zoomEnabled: true
                //     , dblClickZoomEnabled: true
                //     , mouseWheelZoomEnabled: true
                //     , preventMouseEventsDefault: true
                //     , zoomScaleSensitivity: 0.2
                //     , minZoom: 0.5
                //     , maxZoom: 10
                //     , fit: true
                //     , contain: false
                //     , center: true
                //     , refreshRate: 'auto'
                //     , beforeZoom: function(){}
                //     , onZoom: function(){}
                //     , beforePan: function(){}
                //     , onPan: function(){}
                //     , customEventsHandler: {}
                //     , eventsListenerElement: null
                // });
            });
            $('#svg_control').load('../svg_control.svg',function()
            {
                document.getElementById('schematic_preview_control').children[0].children[0].id = 'svg_control_id';
                //document.getElementById("svg_flow");
                //var panZoomTiger = svgPanZoom(document.getElementById('schematic_preview'));
                svgPanZoom(document.getElementById('svg_control_id'));
                // var zoom = svgPanZoom(document.getElementById('schematic_preview'), {
                //       panEnabled: true
                //     , controlIconsEnabled: false
                //     , zoomEnabled: true
                //     , dblClickZoomEnabled: true
                //     , mouseWheelZoomEnabled: true
                //     , preventMouseEventsDefault: true
                //     , zoomScaleSensitivity: 0.2
                //     , minZoom: 0.5
                //     , maxZoom: 10
                //     , fit: true
                //     , contain: false
                //     , center: true
                //     , refreshRate: 'auto'
                //     , beforeZoom: function(){}
                //     , onZoom: function(){}
                //     , beforePan: function(){}
                //     , onPan: function(){}
                //     , customEventsHandler: {}
                //     , eventsListenerElement: null
                // });
            });
            $('#svg_cell').load('../svg_cell.svg',function()
            {
                document.getElementById('schematic_preview_cell').children[0].children[0].id = 'svg_cell_id';
                //document.getElementById("svg_flow");
                //var panZoomTiger = svgPanZoom(document.getElementById('schematic_preview'));
                svgPanZoom(document.getElementById('svg_cell_id'));
                // var zoom = svgPanZoom(document.getElementById('schematic_preview'), {
                //       panEnabled: true
                //     , controlIconsEnabled: false
                //     , zoomEnabled: true
                //     , dblClickZoomEnabled: true
                //     , mouseWheelZoomEnabled: true
                //     , preventMouseEventsDefault: true
                //     , zoomScaleSensitivity: 0.2
                //     , minZoom: 0.5
                //     , maxZoom: 10
                //     , fit: true
                //     , contain: false
                //     , center: true
                //     , refreshRate: 'auto'
                //     , beforeZoom: function(){}
                //     , onZoom: function(){}
                //     , beforePan: function(){}
                //     , onPan: function(){}
                //     , customEventsHandler: {}
                //     , eventsListenerElement: null
                // });
            });
            // var panZoomTiger = svgPanZoom('#schematic_preview');


            //$('#schematic_preview').load(str);
            // $.post('/api/getFile',{path: str},function(data)
            // {
            //     console.log(data);
            // });

            (document.getElementById('design_preview')).hidden = false;
            (document.getElementById('flow_btn')).className = 'page-item active';
            (document.getElementById('schematic_preview_flow')).hidden = false;
        }
        if (status == 'Failure')
        {
            terminalLog('Compilation Failed!');
            terminalLog('Fluigi place and route was unable to process your file.');
            terminalLog('Please check your file for syntax errors.');
            terminalLog('You may review you console readout to help diagnose your error.');
        }
    });
}

function generateUCF_UI()
{
    generateUCF_UI.count = generateUCF_UI.count + 1 || ( $("#accordion div.panel-default").length  );
    var titleRef = "#content" + generateUCF_UI.count;
    var titleREF = "content" + generateUCF_UI.count;
    var operator_id = "operator_" + generateUCF_UI.count;
    var name_id = "name_" + generateUCF_UI.count;
    var input_id = "inputs_" + generateUCF_UI.count;
    var inputTerms_id = "inputTerms_" + generateUCF_UI.count;
    var outputs_id = "outputs_" + generateUCF_UI.count;
    var outputTerms_id = "outputTerms_" + generateUCF_UI.count;
    var import_id = "import_" + generateUCF_UI.count;
    var path_id = "path_" + generateUCF_UI.count;
    var mint_id = "mint_" + generateUCF_UI.count;
    var layer_id = "layer_" + generateUCF_UI.count;

    var divID = 'id' + generateUCF_UI.count;
    var operator;
    var name;

    var op_symbol = $('#operator_symbol_in').val();
    var op_name = $('#operator_name_in').val();

    var opId = 'op' + generateUCF_UI.count;
    var boobs = '\'' + opId + '\'';

    var html = '<div class="panel panel-default" id=opId > \
        <div class="panel-heading"> \
            <h4 class="panel-title"> \
                <a data-toggle="collapse" data-parent="#accordion" href=titleRef> \
                    (temp_symbol) &nbsp  temp_name \
                </a> \
                <span class="pull-right"> \
                    <button type="button" class="btn btn-xs btn-danger" onclick="deleteOp(boobs)">x</button> \
                </span> \
            </h4> \
        </div> \
        <div id=titleREF class="panel-collapse collapse "> \
            <div class="panel-body"> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Operator </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="operatorTag" class="form-control" type="text" value="temp_symbol2" id=operator_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Name </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="nameTag" class="form-control" type="text" value="temp_name2" id=name_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Inputs </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="inputsTag" class="form-control" type="number" value="" id=inputs_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Input Terms </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="inputTermsTag" class="form-control" type="text" value="" id=inputTerms_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Outputs </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="outputsTag" class="form-control" type="number" value="" id=outputs_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Output Terms </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="outputTermsTag" class="form-control" type="text" value="" id=outputTerms_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Import </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="importTag" class="form-control" type="text" value="" id=import_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Path </strong></label> \
                    <div class="col-xs-10"> \
                        <input cname="pathTag" lass="form-control" type="text" value="" id=path_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Mint </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="mintTag" class="form-control" type="text" value="" id=mint_id> \
                    </div> \
                </div> \
                <div class="form-group row"> \
                    <label for="example-text-input" class="col-xs-2 col-form-label"><strong> Layer </strong></label> \
                    <div class="col-xs-10"> \
                        <input name="layerTag" class="form-control" type="text" value="" id=layer_id> \
                    </div> \
                </div> \
            </div> \
        </div> \
    </div> \ ';


    html = html.replace('titleRef',titleRef);
    html = html.replace('titleREF',titleREF);
    html = html.replace('titleRef',titleRef);
    html = html.replace('operator_id',operator_id);
    html = html.replace('name_id',name_id);
    html = html.replace('inputs_id',input_id);
    html = html.replace('inputTerms_id',inputTerms_id);
    html = html.replace('outputs_id',outputs_id);
    html = html.replace('outputTerms_id',outputTerms_id);
    html = html.replace('import_id',import_id);
    html = html.replace('path_id',path_id);
    html = html.replace('mint_id',mint_id);
    html = html.replace('layer_id',layer_id);
    html = html.replace('opId',opId);
    html = html.replace('boobs',boobs);
    html = html.replace('temp_symbol',op_symbol);
    html = html.replace('temp_name',op_name);
    html = html.replace('temp_symbol2',op_symbol);
    html = html.replace('temp_name2',op_name);

    //document.getElementById('ucf_maker').appendChild(html);
    $("#accordion").append(html);
}

function generateUCF()
{
    var numOperators = $("#accordion div.panel-default").length;
    var idArray = [];
    var idArrayClean = [];
    for (var k = 0; k < numOperators; k++)
    {
        idArray[k] = $("#accordion div.panel-default")[k].id;
        idArrayClean[k] = idArray[k].slice(-1);
    }
    var JSON = [];


    var operatorInfo = document.getElementsByTagName('operatorTag');
    var nameInfo = document.getElementsByTagName('nameTag');
    var inputsInfo = document.getElementsByTagName('inputsTag');
    var inputTermsInfo = document.getElementsByTagName('inputTermsTag');
    var outputsInfo = document.getElementsByTagName('outputsTag');
    var outputTermsInfo = document.getElementsByTagName('outputTermsTag');
    var importInfo = document.getElementsByTagName('importTag');
    var pathInfo = document.getElementsByTagName('pathTag');
    var mintInfo = document.getElementsByTagName('mintTag');
    var layerInfo = document.getElementsByTagName('layerTag');

    for (var i = 0; i < numOperators; i++)
    {
        var w = idArrayClean[i];
        var operator = document.getElementById('operator_' + w).value;
        var name = document.getElementById('name_' + w).value;
        var inputs = document.getElementById('inputs_' + w).value;
        var inputTerms = document.getElementById('inputTerms_' + w).value;
        var outputs = document.getElementById('outputs_' + w).value;
        var outputTerms = document.getElementById('outputTerms_' + w).value;
        var Import = document.getElementById('import_' + w).value;
        var path = document.getElementById('path_' + w).value;
        var mint = document.getElementById('mint_' + w).value;
        var layer = document.getElementById('layer_' + w).value;

        var single_stage =
        {
            "operator":operator,
            "name":name,
            "inputs":inputs,
            "inputTerms":inputTerms,
            "outputs":outputs,
            "outputTerms":outputTerms,
            "import":Import,
            "picpath":path,
            "mint":mint,
            "layer":layer
        };

        for (var key in single_stage)
        {
            if (single_stage[key] == "")
            {
                delete single_stage.key;
            }
        }

        JSON.push(single_stage);

    }


    var ucf = document.getElementById('ucf_name_in').value;
    if (ucf == "")
    {
        toastr.warning('Please enter UCF file name','UCF not created: ')
    }
    else
    {
        var ucf_name = ucf + '.json';
        var path = localStorage.PROJECT + '/' +  ucf_name;
        toastr.success(path,'UCF created at: ');
        $.post('/api/generateUCF',{content:JSON,path:path},function(data,error)
        {
            file_sync();
        });
    }
}

function loadPreviousProject(project)
{
    console.log(project);
    localStorage.PROJECT = localStorage.WORKSPACE + '/' + project;
    toastr.success(project, 'Project Selected: ')
    window.location.href = '../dashboard';
}

function nameProject()
{
    $('#name_project').modal('show');
}

function generateNewProject()
{
    var projectName = $('#projectNameInput').val();
    $('#name_project').modal('hide');
    localStorage.PROJECT = localStorage.WORKSPACE + '/' + projectName;

    $.post('/api/makeProject',{projectName:localStorage.PROJECT},function(data,error)
    {
        if(data.status == 'project_exists_already')
        {

            toastr.error('Project with identical name already exists', 'Cannot Create Project:')
        }
        if (data.status == 'project_created')
        {
            toastr.success(projectName, 'New Project Created:');
            window.location.href = '../dashboard';
        }
    });
}

function scanFiles()
{
    var apple = $.post('/api/scanFiles',{workspace:localStorage.WORKSPACE},function(data,error)
    {
        localStorage.FILE_TREE = JSON.stringify(data);

        var file_tree = JSON.parse(localStorage.FILE_TREE);
        $.get('../javascripts/file_tree_template.hbs', function (data)
        {
            var template = Handlebars.compile(data);
            var myhtml = template(file_tree);
            $("#file_tree").html(myhtml);
            color_ui()
        },'html');

        var project = baseName(localStorage.PROJECT);
        for (var i = 0; i < file_tree.children.length; i++)
        {
            if (file_tree.children[i].name == project)
            {
                var lfr_count = 0;
                var ucf_count = 0;
                var mint_count = 0;
                var ini_count = 0;
                for(var j = 0; j < file_tree.children[i].children.length; j++)
                {
                    if (file_tree.children[i].children[j].type == '.v')
                    {
                        lfr_count++;
                        if (localStorage.LFR == undefined)
                        {
                            localStorage.LFR = file_tree.children[i].children[j].path;
                            localStorage.LFR_name = file_tree.children[i].children[j].name;
                        }
                    }
                    if (file_tree.children[i].children[j].type == '.json')
                    {
                        ucf_count++;
                        if (localStorage.UCF == undefined)
                        {
                            localStorage.UCF = file_tree.children[i].children[j].path;
                            localStorage.UCF_name = file_tree.children[i].children[j].name;
                        }
                    }
                    if (file_tree.children[i].children[j].type == '.uf')
                    {
                        mint_count++;
                        if (localStorage.MINT == undefined)
                        {
                            localStorage.MINT = file_tree.children[i].children[j].path;
                            localStorage.MINT_name = file_tree.children[i].children[j].name;
                        }
                    }
                    if (file_tree.children[i].children[j].type == '.ini')
                    {
                        ini_count++;
                        if (localStorage.INI == undefined)
                        {
                            localStorage.INI = file_tree.children[i].children[j].path;
                            localStorage.INI_name = file_tree.children[i].children[j].name;
                        }
                    }
                }
            }
        }

        if (window.location.pathname == '/specify')
        {
            document.getElementById('LFRtab_t').innerText = localStorage.LFR_name;
            document.getElementById('UCFtab_t').innerText = localStorage.UCF_name;
            pushFileToEditor(editor_specify,'specifyUCF',UCF_tab);
            pushFileToEditor(editor_specify,'specifyLFR',LFR_tab);
        }
        if (window.location.pathname == '/design')
        {
            document.getElementById('MINTtab_t').innerText = localStorage.MINT_name;
            document.getElementById('INItab_t').innerText = localStorage.INI_name;
            pushFileToEditor(editor_design,'designMINT',MINT_tab);
            pushFileToEditor(editor_design,'designINI',INI_tab);
        }
        return data;
    });
    return apple;
}

function baseName(path)
{
    return path.split(/[\\/]/).pop();
}

function color_ui()
{
    var proj_id = localStorage.PROJECT + '_pid';
    var lfr_id = localStorage.LFR + '_fid';
    var ucf_id = localStorage.UCF + '_fid';
    var mint_id = localStorage.MINT + '_fid';
    var ini_id = localStorage.INI + '_fid';
    proj_id = proj_id.replace(/\\/g,'\\\\');
    lfr_id = lfr_id.replace(/\\/g,'\\\\');
    ucf_id = ucf_id.replace(/\\/g,'\\\\');
    mint_id = mint_id.replace(/\\/g,'\\\\');
    ini_id = ini_id.replace(/\\/g,'\\\\');
    document.getElementById(proj_id).style.color = 'purple';
    document.getElementById(lfr_id).style.color = 'green';
    document.getElementById(ucf_id).style.color = 'green';
    document.getElementById(mint_id).style.color = 'green';
    document.getElementById(ini_id).style.color = 'green';
}

// ALL NEW FLUIGI CLOUD FUNCTIONS SHOULD GO DOWN HERE

function newFile(filetype)
{
    var filename = (document.getElementById('new_file_name').value);
    console.log(filename);
    switch (filetype)
    {
        case 'LFR':
            $.post("/api/Create_Bucket_Object",{Target_Bucket_ID:'neptune.primary.fs',Target_Bucket_KEY:filename,Target_Bucket_BODY:'New LFR'});
            break;
        case 'UCF':
            $.post("/api/Create_Bucket_Object",{Target_Bucket_ID:'neptune.primary.fs',Target_Bucket_KEY:filename,Target_Bucket_BODY:'New UCF'});
            break;
        case 'MINT':
            $.post("/api/Create_Bucket_Object",{Target_Bucket_ID:'neptune.primary.fs',Target_Bucket_KEY:filename,Target_Bucket_BODY:'New MINT'});
            break;
        case 'INI':
            $.post("/api/Create_Bucket_Object",{Target_Bucket_ID:'neptune.primary.fs',Target_Bucket_KEY:filename,Target_Bucket_BODY:'New INI'});
            break;
    }
}

function queryWorkspace(workspace_id)
{
    $.post('/api/queryWorkspace',{workspace_id:workspace_id},function(workspace){
        var workspace_json = workspace.design_files;
        console.log(workspace_json);
    });

}