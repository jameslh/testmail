// Load application styles
import 'styles/index.scss';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import 'datatables.net-select-bs4/css/select.bootstrap4.css';

import _ from 'lodash';
import $ from 'jquery';
import io from 'socket.io-client';
import 'datatables.net';
import 'datatables.net-bs4';
import 'datatables.net-select';
import 'bootstrap/dist/js/bootstrap.js';
import * as moment from 'moment';

import {iconReload, iconTrash} from 'icons';


$(function(){
	var socket = io();
	var emailURL = '/messages';
	var escapeHtmlFn = $.fn.dataTable.render.text();
	var dtable = $("#messages").DataTable({
		dom: '<"float-left"f><"float-left loading-icon">prt<"float-right"p>li',
		serverSide: true,
		pageLength: 20,
		lengthMenu: [[10, 20, 50, 100, 200], [10, 20, 50, 100, 200]],
		select: true,
		ajax: {
			url: '/messages',
			dataType: 'json',
			error: function(err, txt){
				console.log(err);
			}
		},
		rowId: '_id',
		order: [[3, 'desc']],
		columns: [
			{data:'subject', title:'Subject', render: function(data,type,row,meta){
				if(!data) return '';
				return escapeHtmlFn.display(data.length > 50 ? data.substr(0, 50)+'...' : data);
			}},
			{data:'from', title:'From', name:'from'},
			{data:'to', title:'To', name:'to'},
			{data:'date', title:'Date', type: 'date', render:function(data,type,row,meta){
				var mdate = moment(data);
				var disp = '';
				if(!mdate.isSame(moment(), 'day')) disp += dateFmt(mdate);
				else disp += timeFmt(mdate);
				disp += "&nbsp;&nbsp;<i>" + mdate.fromNow() + "</i>";
				return disp;
			}},
			{data:'_id', className:'action-col', orderable: false, title: 'Delete', render: function(data,type,row,meta){
				return '<i class="deleteEmailBtn" data-eid="'+data+'">'+iconTrash()+'</i>';
			}},
		]
	})
	.on('select', function(e, dt, type, indexes){
		if (type === 'row') setSelectedEmail(dtable.row(indexes).data()._id);
	})
	.on('processing', function(e, settings, processing){
		if(processing) $('.loading-icon').fadeIn('fast');
		else $('.loading-icon').fadeOut('slow');
	});

	var debounceReload = _.debounce(function(){
		dtable.ajax.reload(null, false);
	}, 1000, {maxWait: 2000});

	socket.on('mail', debounceReload);

	$('#messages').on('click', '.deleteEmailBtn', function(e){
		var _id = $(this).data('eid');
		e.stopImmediatePropagation();
		deleteEmail(_id)
			.then(function(){
				dtable.ajax.reload();
				setSelectedEmail(0);
			});
	});

	$('.refreshBtn').click(function(){
		dtable.ajax.reload();
		setSelectedEmail(0);
	});

	$('.deleteAllEmailBtn').click(function(){
		deleteAllEmail()
			.done(function(){
				dtable.ajax.reload();
				setSelectedEmail(0);
			});
	});

	// display message stats
	setInterval(getMessageStats, 10 * 1000);
	getMessageStats();
});


function setSelectedEmail(id){
	$('#mail-message iframe').contents().find('body').empty();
	$('#mail-raw-content').empty();

	if(!id) return;

	var headerTpl = _.template(`
		<h4 class="email-subject"><%- d.subject %></h4>
		<table class="table table-sm email-table" cellpadding="0" cellspacing="0">
			<tr><td class="email-label"><label>Sent</label></td><td><%= d.date %></td></tr>
			<tr><td class="email-label"><label>To</label></td><td><%- d.to %></td></tr>
			<tr><td class="email-label"><label>From</label></td><td><%- d.from %></td></tr>
		</table>
		<% if(d.attachments && d.attachments.length){ %> 
			<ul class="email-attachments">
				<% _.each(d.attachments, function(att){ %>
					<li><i class="glyphicon glyphicon-file"></i><a class="document" target="_blank" href="/messages/<%= d._id %>/attachment/<%= att.checksum %>"><%- att.basename %></a></li>
				<% }); %>
			</ul>
		<% } %>
	`, {variable: 'd'});

	return getMessage(id)
		.then(function(resp){
			var mdate = moment(resp.date, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
			var headerHtml = headerTpl({
				_id: resp._id,
				subject: resp.subject || 'No Subject',
				from: _.map(_.get(resp, 'from.value'), function(o){ return o.address }).join('; '),
				to: _.map(_.get(resp, 'to.value'), function(o){ return o.address }).join('; '),
				date: dateFmt(mdate) + ' <i>' + mdate.fromNow() + '</i>',
				attachments: resp.attachments,
			});
			
			var msgHtml = '';
			if(resp.html){
				msgHtml = '<div class="email-content">'+resp.html+'</div>';
			} else {
				msgHtml = '<div class="email-content"><pre style="white-space: pre-wrap;">'+resp.text+'</pre></div>';
			}

			$(".mail-header").html(headerHtml);
			var $b = $(msgHtml).appendTo($("#mail-message iframe").contents().find("body"));
			$("#mail-message iframe").height( $b.height() + 20 );
			$('<pre></pre>').text(JSON.stringify(resp, null, '\t')).appendTo("#mail-raw-content");
		});
}

function getMessage(id){
	return $.getJSON('/messages/'+id);
}

function getMessageStats(){
	return $.getJSON('/messages/stats')
		.fail(function(err, txt){
			$(".server-status").empty().append( 
				$('<p class="bg-danger">').text('Server is not responding as of: ' + dateFmt())
			);
		})
		.then(function(resp){
			var count = resp && resp.count ? resp.count : 0;
			$(".server-status").empty().append( 
				$('<span></span>').html('Server Running @  ' + dateFmt() + '<br/>Message Count: <span class="message-count">' + count + '</span>')
			);
		});
}

function deleteAllEmail(){
	return $.ajax({url: '/messages', method: 'delete'});
}

function deleteEmail(_id){
	return $.ajax({url: '/messages/'+_id, method: 'delete'});
}

function dateFmt(dt){
	return moment(dt).format('MM/DD/YYYY hh:mm:ss a');
}

function timeFmt(dt){
	return moment(dt).format('hh:mm:ss a');
}