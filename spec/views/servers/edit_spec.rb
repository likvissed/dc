require 'rails_helper'

RSpec.describe "servers/edit", type: :view do

  let(:server) { create(:server) }
  before do
    assign(:server, server)
    params[:name] = server.name
    render
  end

  it "renders form with server_type action" do
    expect(rendered).to have_selector("form[action='#{server_path(server.name)}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders form with serv-form directive" do
    expect(rendered).to have_selector("form[serv-form='#{server.id}']")
  end

  it "renders form with serv-name directive" do
    expect(rendered).to have_selector("form[serv-name='#{server.name}']")
  end

  it "renders \"ready\" button with name='commit'" do
    expect(rendered).to have_selector("input[name='commit']")
  end

  it "renders \"ready\" button with value='Готово'" do
    expect(rendered).to have_selector("input[value='Готово']")
  end

  it "renders \"cancel\" button with name='cancel'" do
    expect(rendered).to have_selector("button[name='cancel']")
  end

  it "renders \"cancel\" button with value='true'" do
    expect(rendered).to have_selector("button[value='true']")
  end

end

RSpec.describe "server_types/edit", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:server_types) { create_list(:server_type, 3) }
  let!(:server_statuses) { create_list(:server_status, 3) }
  let(:server) { create(:server) }
  before do
    login_as admin_user
    visit "servers/#{server.name}/edit"
    sleep 0.1
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq servers_path
    end
  end

  context "when json response is received" do
    let(:current_status_list) { page.find("select[name='server[server_status_id]']").all("option").map(&:text) }
    let(:expected_status_list) { ["Выберите статус сервера"] }
    subject(:click_status_select) do
      page.find("select[name='server[server_status_id]']").click
      sleep 0.1
    end

    it "creates select field with server_status values" do
      click_status_select
      expected_status_list.concat ServerStatus.all.map(&:name)
      expect(current_status_list).to eq expected_status_list
    end

    let(:current_status_option) { page.find("select[name='server[server_status_id]']").all("option[selected]").last.text }

    it "selectes the desired option in server_status field" do
      click_status_select
      expect(current_status_option).to eq server.server_status.name
    end

    let(:current_type_list) { page.find("select[name='server[server_type_id]']").all("option").map(&:text) }
    let(:expected_type_list) { ["Выберите тип сервера"] }
    subject(:click_type_select) do
      page.find("select[name='server[server_type_id]']").click
      sleep 0.1
    end

    it "creates select field with server_type values" do
      click_type_select
      expected_type_list.concat ServerType.all.map(&:name)
      expect(current_type_list).to eq expected_type_list
    end

    let(:current_type_option) { page.find("select[name='server[server_type_id]']").all("option[selected]").last.text }

    it "selectes the desired option in server_type field" do
      click_type_select
      expect(current_type_option).to eq server.server_type.name
    end

    # + 2 - это строки для Типа сервера и Статуса сервера
    it "renders the page with necessary count of rows" do
      expect(page).to have_selector(".row", count: server.server_parts.count + 2)
    end

    context "server data" do
      let(:current_server_part_names) { page.all("[data-id='server-structure']").map{ |row| row.find("select option[selected]").text } }
      let(:expected_server_part_names) { server.server_parts.map(&:name) }

      it "renders a server_parts names" do
        expect(current_server_part_names).to eq expected_server_part_names
      end

      let(:current_server_part_counts) { page.all("[data-id='server-structure']").map{ |row| row.find("input[type='text']")[:value].to_i } }
      let(:expected_server_part_counts) { server.real_server_details.map(&:count) }

      it "renders a server_parts count" do
        expect(current_server_part_counts).to eq expected_server_part_counts
      end
    end

    context "when click a plus button" do
      before do
        page.assert_selector("button[ng-click='addServPart()']", count: server.server_parts.count)
        page.all("button[ng-click='addServPart()']").last.click
      end

      it "adds one more row" do
        expect(page).to have_selector(".row", count: server.server_parts.count + 2 + 1)
      end
    end
  end

  context "when click a minus button" do
    before do
      page.assert_selector("button[ng-click='delServPart(detail)']", count: server.server_parts.count)
      page.all("button[ng-click='delServPart(detail)']").last.click
    end

    it "deletes the row" do
      expect(page).to have_selector(".row", count: server.server_parts.count + 2 - 1)
    end
  end

  context "when changes the server_type field" do
    subject { page.find("select[name='server[server_type_id]'] option[value='#{server_types.last.id}']").select_option }
    let(:current_server_part_names) { page.all("[data-id='server-structure']").map{ |row| row.find("select option[selected]").text } }
    let(:expected_server_part_names) { server_types.last.server_parts.map(&:name) }
    before do
      subject
      sleep 0.1
    end

    it "renders a new server_parts names" do
      expect(current_server_part_names).to eq expected_server_part_names
    end

    let(:current_server_part_counts) { page.all("[data-id='server-structure']").map{ |row| row.find("input[type='text']")[:value].to_i } }
    let(:expected_server_part_counts) { server_types.last.template_server_details.map(&:count) }

    it "renders a new server_parts count" do
      expect(current_server_part_counts).to eq expected_server_part_counts
    end

  end

  context "when sends empty data" do
    before do
      fill_in "server[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with server_types action" do
      expect(page).to have_selector("form[action='#{server_path(server.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end

    it "again renders data about structure of current type" do
      expect(page).to have_selector(".row", count: server.server_parts.count + 2)
    end
  end

end